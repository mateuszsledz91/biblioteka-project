const API_URL = "http://localhost:3000";


const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getBooks = async () => {
  const response = await fetch(`${API_URL}/api/books`);

  const data = await response.json();

  return data;
};

export const addBook = async (book) => {
  const response = await fetch(`${API_URL}/api/books`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(book),
  });

  const data = await response.json();

  return data;
};

export const deleteBook = async (id) => {
  const response = await fetch(`http://localhost:3000/api/books/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Nie udało się usunąć książki");
  }

  return data;
};


export const editBook = async (id, book) => {
  const response = await fetch(`${API_URL}/api/books/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(book),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Nie udało się edytować książki");
  }

  return data;
};

export const registerUser = async(user) => {
    const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

    const data = await response.json();

    if (!response.ok) {
  throw new Error(data.error || "Nie udało się zarejestrować");
}

    return data;
};

export const loginUser = async (user) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Nie udało się zalogować");
  }

  return data;
};



export const borrowBook = async (bookId) => {
  const response = await fetch(`${API_URL}/api/borrowings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Nie udało się wypożyczyć książki."
    );
  }

  return data;
};

export const getMyBorrowings = async () => {
  const response = await fetch(`${API_URL}/api/my-borrowings`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  return data;
};

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  return data;
};

export const getUserStats = async (userId) => {
  const response = await fetch(`${API_URL}/api/users/${userId}/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const returnBook = async (borrowingId) => {
  const response = await fetch(`${API_URL}/api/borrowings/${borrowingId}/return`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  return data;
};



export const reserveBook = async (bookId) => {
  const response = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Nie udało się zarezerwować książki");
  }

  return data;
};


export const toggleBlockUser = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/toggle-block`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
};


export const cancelReservation = async (reservationId) => {
  const response = await fetch(`${API_URL}/api/reservations/${reservationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Nie udało się anulować rezerwacji");
  }

  return data;
};