const pool = require("./db");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});


const JWT_SECRET = "dev_secret";


const app = express();

app.use(cors());
app.use(express.json());



//ŁĄCZENIE SIE Z BAZĄ
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Błąd połączenia z bazą:", err);
  } else {
    console.log("Połączono z PostgreSQL!");
    console.log(result.rows[0]);
  }
});




app.get("/api/books", 

  async (req, res) => {
const result = await pool.query("SELECT * FROM books ORDER BY id ASC");
  res.json(result.rows);
});



//KSIĄŻKIII ADMINOWE 


app.get(
  "/api/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT id, username, email, role, created_at, is_blocked
        FROM users
        ORDER BY id ASC;
        `
      );

      res.json(result.rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }
  }
);

app.get(
  "/api/users/:id/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      const totalResult = await pool.query(
        "SELECT COUNT(*) AS total FROM borrowings WHERE user_id = $1",
        [userId]
      );
      const notReturnedResult = await pool.query(
        "SELECT COUNT(*) AS not_returned FROM borrowings WHERE user_id = $1 AND returned_at IS NULL",
        [userId]
      );

      res.json({
        borrowedCount: Number(totalResult.rows[0].total),
        notReturnedCount: Number(notReturnedResult.rows[0].not_returned),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Błąd serwera",
      });
    }
  }
);


app.post("/api/books", 
  authenticateToken,
  requireAdmin, 
  async (req, res) => {  
try {

if (
  typeof req.body.total_copies !== "number" ||
  typeof req.body.available_copies !== "number" ||
  req.body.total_copies < 0 ||
  req.body.available_copies < 0 ||
  req.body.available_copies > req.body.total_copies
) {
  return res.status(400).json({
    error: "Niepoprawna liczba egzemplarzy",
  });
}

if (
  typeof req.body.title !== "string" ||
   req.body.title.trim() === "" 
   ) {
  return res.status(400).json({
    error: "Brak Tytułu",
  });
}

  const result = await pool.query(
  `
  INSERT INTO books (
    title,
    author,
    total_copies,
    available_copies
  )
  VALUES (
    $1,
    $2,
    $3,
    $4
  )
  RETURNING *;
  `,
  [
    req.body.title,
    req.body.author,
    req.body.total_copies,
    req.body.available_copies,
  ]
);

res.status(201).json(result.rows[0]);

}catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }


});




app.delete(
  "/api/books/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try{
    const bookId = Number(req.params.id);

    const isUsed = await pool.query(
      "SELECT * FROM borrowings WHERE book_id = $1;",
      [bookId]
    );

    if (isUsed.rowCount !== 0) {
      return res.status(400).json({
        error: "Nie można usunąć książki, która ma historię wypożyczeń",
      });
    }

    const result = await pool.query(
      "DELETE FROM books WHERE id = $1;",
      [bookId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Nie znaleziono książki",
      });
    }

    res.json({
      message: "Książka usunięta",
    });
  
    }catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }
  
  
  });

app.put("/api/books/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const { title, author, total_copies } = req.body;

    if (!title || total_copies === undefined) {
      return res.status(400).json({
        error: "Podaj tytuł i liczbę egzemplarzy",
      });
    }

    const borrowedResult = await pool.query(
      `SELECT COUNT(*) 
       FROM borrowings 
       WHERE book_id = $1 AND returned_at IS NULL`,
      [bookId]
    );

    const borrowedCount = Number(borrowedResult.rows[0].count);

    if (Number(total_copies) < borrowedCount) {
      return res.status(400).json({
        error: `Nie można ustawić liczby egzemplarzy na ${total_copies}, bo aktualnie wypożyczonych jest ${borrowedCount}.`,
      });
    }

    const availableCopies = Number(total_copies) - borrowedCount;

    const result = await pool.query(
      `UPDATE books
       SET title = $1,
           author = $2,
           total_copies = $3,
           available_copies = $4
       WHERE id = $5
       RETURNING *`,
      [title, author, total_copies, availableCopies, bookId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});



//KSIĄŻKI WYPORZYCZANIE

app.post("/api/borrowings", authenticateToken, async (req, res) => {
  
  try{
  
  const bookId = Number(req.body.bookId);

  const bookResult = await pool.query(
    "SELECT * FROM books WHERE id = $1",
    [bookId]
  );

  if (bookResult.rows.length === 0) {
    return res.status(404).json({
      error: "Nie znaleziono książki",
    });
  }

  if (bookResult.rows[0].available_copies <= 0) {
    return res.status(400).json({
      error: "Brak dostępnych egzemplarzy",
    });
  }

const existingBorrowing = await pool.query(
  `
  SELECT *
  FROM borrowings
  WHERE user_id = $1
    AND book_id = $2
    AND returned_at IS NULL;
  `,
  [req.user.id, bookId]
);

if (existingBorrowing.rowCount > 0) {
  return res.status(400).json({
    error: "Masz już wypożyczoną tę książkę.",
  });
}




  const borrowResult = await pool.query(
    `
    INSERT INTO borrowings (
      user_id,
      book_id
    )
    VALUES (
      $1,
      $2
    )
    RETURNING *;
    `,
    [req.user.id, bookId]
  );



  await pool.query(
    `
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = $1;
    `,
    [bookId]
  );

  res.status(201).json(borrowResult.rows[0]);
  }catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }


});




app.get("/api/my-borrowings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const borrowingsResult = await pool.query(
      `SELECT 
        b.id,
        books.title,
        books.author,
        b.borrowed_at,
        b.returned_at,
        false AS is_reservation,
        NULL AS reserved_at
      FROM borrowings b
      JOIN books ON b.book_id = books.id
      WHERE b.user_id = $1`,
      [userId]
    );

    const reservationsResult = await pool.query(
      `SELECT 
        r.id,
        books.title,
        books.author,
        NULL AS borrowed_at,
        NULL AS returned_at,
        true AS is_reservation,
        r.created_at AS reserved_at
      FROM reservations r
      JOIN books ON r.book_id = books.id
      WHERE r.user_id = $1
      AND r.status = 'ACTIVE'`,
      [userId]
    );

    const allItems = [
      ...borrowingsResult.rows,
      ...reservationsResult.rows,
    ];

    res.json(allItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});



app.put(
  "/api/borrowings/:id/return",
  authenticateToken,
  async (req, res) => {
    try{

  const borrowId = Number(req.params.id);

const borrowResult = await pool.query(
    "SELECT * FROM borrowings WHERE id = $1",
    [borrowId]
  );

  if (borrowResult.rows.length === 0) {
    return res.status(404).json({
      error: "Nie ma takiego wyporzyczenia",
    });
  }

  if (borrowResult.rows[0].user_id !== req.user.id){
    return res.status(404).json({
      error: "Ta książka nie została wyporzyczona przez takiego użytkownika",
    });
  }

  if (borrowResult.rows[0].returned_at !== null){
    return res.status(404).json({
      error: "Ta książka została już oddana",
    });
  }


    await pool.query(
  `
  UPDATE books
  SET available_copies = available_copies + 1
  WHERE id = $1;
  `,
  [borrowResult.rows[0].book_id]
);

const result = await pool.query(
  `
  UPDATE borrowings
  SET returned_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *;
  `,
  [borrowId]
);

const nextReservation = await pool.query(
  `
  SELECT r.user_id, books.title
  FROM reservations r
  JOIN books ON r.book_id = books.id
  WHERE r.book_id = $1
    AND r.status = 'ACTIVE'
  ORDER BY r.created_at ASC
  LIMIT 1
  `,
  [borrowResult.rows[0].book_id]
);

if (nextReservation.rowCount > 0) {
  await sendPushToUser(
    nextReservation.rows[0].user_id,
    "SmartLibrary",
    `Książka "${nextReservation.rows[0].title}" jest już dostępna do odbioru.`
  );
}


res.json(result.rows[0]);


    }catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }

  }
);










//LOGOWANIE I REJESTRACJAAA


app.post("/api/register", async (req, res) => {
  
try{
if (
    typeof req.body.username !== "string" ||
    typeof req.body.email !== "string" ||
    typeof req.body.password !== "string" ||
    req.body.username.trim() === "" ||
    req.body.email.trim() === "" ||
    req.body.password.trim() === ""
  ) {
    return res.status(400).json({
      error: "Niepoprawne dane",
    });
  }

  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [req.body.email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      error: "Email już istnieje",
   });
  }

  const hash = await bcrypt.hash(req.body.password, 10);

  const result = await pool.query(
  `
  INSERT INTO users (
    username,
    email,
    password_hash
  )
  VALUES (
    $1,
    $2,
    $3

  )
  RETURNING id, username, email, role; 
  `,
  [
    req.body.username,
    req.body.email,
    hash,
  ]
);



res.status(201).json({
  id: result.rows[0].id,
  username: result.rows[0].username,
  email: result.rows[0].email,
  role: result.rows[0].role,
});
}catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }
});


app.post("/api/login", async (req, res) => {
try{
  if (
    typeof req.body.email !== "string" ||
    typeof req.body.password !== "string" ||
    req.body.email.trim() === "" ||
    req.body.password.trim() === ""
  ) {
    return res.status(400).json({
      error: "Niepoprawne dane",
    });
  }

  
 
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [req.body.email]
  );

  if (existingUser.rows.length === 0) {
  return res.status(409).json({
    error: "Błędne dane",
  });
}



  
const isValid = await bcrypt.compare(
  req.body.password,
  existingUser.rows[0].password_hash
);

    
    if(isValid){
      const user = existingUser.rows[0];


if (user.is_blocked) {
  return res.status(403).json({
    error: "Konto zostało zablokowane.",
  });
}

  const token = jwt.sign(
   {
      id: user.id,
     username: user.username,
     role: user.role,
    },
   JWT_SECRET
);




return res.status(200).json({
  message: "Logowanie poprawne",
  token: token,
  username: user.username,
  role: user.role,
});

    }else{
      return res.status(409).json({
      error: "Błędne dane",
    });
    }
  }catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Błąd serwera",
      });
    }
});


function authenticateToken(req, res, next) {
   const authHeader = req.headers["authorization"];

if (!authHeader) {
  return res.status(401).json({
    error: "Brak tokena",
  });
}

const token = authHeader.split(" ")[1];

   

   try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
   } catch (error) {
    return res.status(403).json({
      error: "Niepoprawny token",
    });
   }


   
}


function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Brak uprawnień",
    });
  }

  next();
}

//REZERWACJE

app.post("/api/reservations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    const bookResult = await pool.query(
      "SELECT * FROM books WHERE id = $1",
      [bookId]
    );

    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Nie znaleziono książki" });
    }

    const book = bookResult.rows[0];

    if (book.available_copies > 0) {
      return res.status(400).json({
        error: "Ta książka jest dostępna. Możesz ją wypożyczyć.",
      });
    }

    const activeBorrowing = await pool.query(
      `SELECT *
       FROM borrowings
       WHERE user_id = $1
       AND book_id = $2
       AND returned_at IS NULL`,
      [userId, bookId]
    );

    if (activeBorrowing.rowCount > 0) {
      return res.status(400).json({
        error: "Masz już wypożyczoną tę książkę.",
      });
    }

    const existingReservation = await pool.query(
      `SELECT *
       FROM reservations
       WHERE user_id = $1
       AND book_id = $2
       AND status = 'ACTIVE'`,
      [userId, bookId]
    );

    if (existingReservation.rowCount > 0) {
      return res.status(400).json({
        error: "Masz już aktywną rezerwację tej książki.",
      });
    }

    const reservationResult = await pool.query(
      `INSERT INTO reservations (user_id, book_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, bookId]
    );

    const queueResult = await pool.query(
      `SELECT COUNT(*)
       FROM reservations
       WHERE book_id = $1
       AND status = 'ACTIVE'`,
      [bookId]
    );

    res.status(201).json({
      message: `Zarezerwowano książkę. Jesteś ${queueResult.rows[0].count} w kolejce.`,
      reservation: reservationResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});


app.delete("/api/reservations/:id", authenticateToken, async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'CANCELLED'
       WHERE id = $1
         AND user_id = $2
         AND status = 'ACTIVE'
       RETURNING *`,
      [reservationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Nie znaleziono aktywnej rezerwacji",
      });
    }

    res.json({
      message: "Rezerwacja została anulowana.",
      reservation: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});


//BLOKOWANIE

app.put("/api/users/:id/toggle-block", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const result = await pool.query(
      `UPDATE users
       SET is_blocked = NOT is_blocked
       WHERE id = $1
         AND role != 'ADMIN'
       RETURNING id, username, email, role, created_at, is_blocked`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: "Nie można zmienić statusu tego użytkownika",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});



//PROFIL UŻYTKOWNIKA

app.get("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});

app.put("/api/users/me", authenticateToken, async (req, res) => {
  try {

    const { username, email } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET username = $1,
           email = $2
       WHERE id = $3
       RETURNING id, username, email`,
      [
        username,
        email,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});



app.post("/api/notifications", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        error: "Podaj token, title i body",
      });
    }

    const message = {
  token,
  data: {
    title,
    body,
  },
  android: {
    priority: "high",
  },
};

const response = await getMessaging().send(message);

    res.json({
      message: "Powiadomienie wysłane",
      firebaseResponse: response,
    });
  } catch (error) {
  console.error("FCM ERROR:", error);

  res.status(500).json({
    error: "Błąd wysyłania powiadomienia",
    details: error.message,
    code: error.code,
  });
}
});



app.post("/api/users/fcm-token", authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Brak tokenu FCM",
      });
    }

    await pool.query(
      `UPDATE users
       SET fcm_token = $1
       WHERE id = $2`,
      [token, req.user.id]
    );

    res.json({
      message: "Token FCM zapisany",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Błąd serwera",
    });
  }
});



async function sendPushToUser(userId, title, body) {
  const result = await pool.query(
    "SELECT fcm_token FROM users WHERE id = $1",
    [userId]
  );

  const token = result.rows[0]?.fcm_token;

  if (!token) {
    return;
  }

  const message = {
    token,
    data: {
      title,
      body,
    },
    android: {
      priority: "high",
    },
  };

  await getMessaging().send(message);
}


app.post(
  "/api/admin/notifications",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, body } = req.body;

      if (
        typeof title !== "string" ||
        typeof body !== "string" ||
        title.trim() === "" ||
        body.trim() === ""
      ) {
        return res.status(400).json({
          error: "Podaj tytuł i treść powiadomienia",
        });
      }

      const usersResult = await pool.query(
        `
        SELECT id, username, fcm_token
        FROM users
        WHERE fcm_token IS NOT NULL
          AND fcm_token != ''
          AND is_blocked = false;
        `
      );

      const tokens = usersResult.rows.map(row => row.fcm_token);

      console.log("FCM users:", usersResult.rows.map(user => ({
        id: user.id,
        username: user.username,
        tokenStart: user.fcm_token.substring(0, 20)
      })));

      if (tokens.length === 0) {
        return res.status(400).json({
          error: "Brak użytkowników z zapisanym tokenem FCM",
        });
      }

      const message = {
        tokens,
        data: {
          title: title.trim(),
          body: body.trim(),
        },
        android: {
          priority: "high",
        },
      };

      const firebaseResponse =
        await getMessaging().sendEachForMulticast(message);

      console.log("FCM successCount:", firebaseResponse.successCount);
      console.log("FCM failureCount:", firebaseResponse.failureCount);
      console.log(
        "FCM responses:",
        firebaseResponse.responses.map(response => ({
          success: response.success,
          errorCode: response.error?.code,
          errorMessage: response.error?.message,
        }))
      );

      res.json({
        message: "Powiadomienia wysłane",
        tokensCount: tokens.length,
        successCount: firebaseResponse.successCount,
        failureCount: firebaseResponse.failureCount,
        responses: firebaseResponse.responses.map(response => ({
          success: response.success,
          errorCode: response.error?.code,
          errorMessage: response.error?.message,
        })),
      });

    } catch (error) {
      console.error("FCM ERROR:", error);

      res.status(500).json({
        error: "Błąd wysyłania powiadomień",
        details: error.message,
        code: error.code,
      });
    }
  }
);




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend działa na porcie ${PORT}`);
});