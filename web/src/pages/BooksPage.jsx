import BookCard from "../components/BookCard";
import { useEffect, useState } from "react";
import { getBooks, addBook, deleteBook, editBook, borrowBook, reserveBook  } from "../api/api";
import { toast } from "react-toastify";



function BooksPage() {
  
  const [books, setBooks] = useState([]);

useEffect(() => {
  const fetchBooks = async () => {
    const data = await getBooks();

    setBooks(data);
  };

  fetchBooks();
}, []);


const [title, setTitle] = useState("");
const [author, setAuthor] = useState("");

const [deleteID, setDeleteID] = useState("");

const [editID, seteditID] = useState("");
const [editTitle, seteditTitle] = useState("");
const [editAuthor, seteditAuthor] = useState("");
const [editTotalCopies, setEditTotalCopies] = useState(1);
const [editAvailableCopies, setEditAvailableCopies] = useState(1);
const [editingBook, setEditingBook] = useState(null);

const [totalCopies, setTotalCopies] = useState(1);
const [availableCopies, setAvailableCopies] = useState(1);

const [search, setSearch] = useState("");
const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);



const [role, setRole] = useState(
  localStorage.getItem("role")
);
const isAdmin = role === "ADMIN";


const handleAddBook = async (e) => {
  e.preventDefault();

  try {
    if (!title.trim()) {
      toast.error("Podaj tytuł");
      return;
    }

    if (Number(availableCopies) > Number(totalCopies)) {
      toast.error("Dostępnych egzemplarzy nie może być więcej niż wszystkich.");
      return;
    }

    const newBook = {
  title,
  author,
  total_copies: Number(totalCopies),
  available_copies: Number(totalCopies),
};

    const addedBook = await addBook(newBook);

    setBooks([...books, addedBook]);

    toast.success("Książka została dodana.");

    setTitle("");
    setAuthor("");
    setTotalCopies(1);
    setAvailableCopies(1);
  } catch (err) {
    toast.error("Nie udało się dodać książki.");
  }
};

const handleDeleteBook = async (e) => {
  e.preventDefault();

  let idToDelete;

  if (deleteID === "") {
    idToDelete = Math.max(...books.map((book) => book.id));
  } else {
    idToDelete = Number(deleteID);
  }

  try {
    await deleteBook(idToDelete);

    setBooks(books.filter((book) => book.id !== idToDelete));

    toast.success("Książka została usunięta.");
    setDeleteID("");
  } catch (err) {
    toast.error(err.message);
  }
};


const handleEditeBook = async (e) => {
  e.preventDefault();

  try {
    if (!editTitle.trim()) {
      toast.error("Tytuł jest wymagany.");
      return;
    }

    const editeBook = {
      title: editTitle,
      author: editAuthor,
      total_copies: Number(editTotalCopies),
    };

    await editBook(editID, editeBook);

    const data = await getBooks();
    setBooks(data);

    toast.success("Zapisano zmiany.");

    seteditID("");
    seteditAuthor("");
    seteditTitle("");
    setEditTotalCopies(1);
    setEditAvailableCopies(1);
    setEditingBook(null);
  } catch (err) {
    toast.error(err.message || "Nie udało się edytować książki.");
  }
};

const handleBorrowBook = async (bookId) => {
  try {
    await borrowBook(bookId);

    const data = await getBooks();
    setBooks(data);

    toast.success("Książka została wypożyczona.");
  } catch (err) {
     toast.error(err.message);
  }
};

  
const handleReserveBook = async (bookId) => {
  try {
    const data = await reserveBook(bookId);

    toast.success(data.message);

    const booksData = await getBooks();
    setBooks(booksData);
  } catch (err) {
    toast.error(err.message);
  }
};

const filteredBooks = books.filter((book) => {
  const matchesSearch =
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase());

  const matchesAvailability =
    !showOnlyAvailable || book.available_copies > 0;

  return matchesSearch && matchesAvailability;
});


const openEditWindow = (book) => {
  setEditingBook(book);
  seteditID(book.id);
  seteditTitle(book.title);
  seteditAuthor(book.author);
  setEditTotalCopies(book.total_copies);

};


  return (
    <section className="books-section">


{isAdmin && (
  <>
    <h1>Panel admina</h1>
     



      <h2>Dodaj książkę</h2>

<form onSubmit={handleAddBook} className="book-form">
  <input
    type="text"
    placeholder="Tytuł"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />



  <input
    type="text"
    placeholder="Autor"
    value={author}
    onChange={(e) => setAuthor(e.target.value)}
  />


  Liczba egzemplarzy:<input
  type="number"
  placeholder="Liczba egzemplarzy"
  value={totalCopies}
  onChange={(e) => setTotalCopies(e.target.value)}
/>


  <button type="submit">Dodaj książkę</button>
</form>

<h2>Usuń książkę</h2>
<form onSubmit={handleDeleteBook} className="book-form">
    <input
    type="text"
    placeholder="id książki"
    value={deleteID}
    onChange={(e) => setDeleteID(e.target.value)}
    />

  <button type="submit">Usuń</button>
</form>

<h2>Edytuj książkę</h2>

<form onSubmit={handleEditeBook} className="book-form-row">

<div className="book-form">
    <input
    type="text"
    placeholder="id książki"
    value={editID}
    onChange={(e) => seteditID(e.target.value)}
    />
    </div>

    <div className="book-form">
    <input
    type="text"
    placeholder="tytuł"
    value={editTitle}
    onChange={(e) => seteditTitle(e.target.value)}
    />
    <input
    type="text"
    placeholder="autor"
    value={editAuthor}
    onChange={(e) => seteditAuthor(e.target.value)}
    />
    total:<input
    type="number"
    placeholder="total egzemplarze"
    value={editTotalCopies}
    onChange={(e) => setEditTotalCopies(e.target.value)}
    />
    
<button type="submit">Edytuj książkę</button>

</div>
</form>


  </>
)}



<h2>Katalog książek</h2>

<div className="search-section">
  <input
    type="text"
    placeholder="Szukaj po tytule lub autorze"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
  />
  <button
    onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
    className={`filter-button ${showOnlyAvailable ? "active" : ""}`}
  >
    {showOnlyAvailable
      ? "Pokaż wszystkie"
      : "Pokaż tylko dostępne"}
  </button>
</div>

      <div className="books-list">
        {filteredBooks.map((book) => (
          <BookCard
  key={book.id}
  id={book.id}
  title={book.title}
  author={book.author}
  totalCopies={book.total_copies}
  availableCopies={book.available_copies}
  onBorrow={handleBorrowBook}
  isAdmin={isAdmin}
  onEdit={() => openEditWindow(book)}
  onReserve={handleReserveBook}
/>
        ))}
      </div>

{editingBook && (
  <div className="edit-modal">
    <div className="edit-modal-content">
      <h3>Edytuj książkę</h3>

      <form onSubmit={handleEditeBook} className="book-form">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => seteditTitle(e.target.value)}
          placeholder="Tytuł"
        />

        <input
          type="text"
          value={editAuthor}
          onChange={(e) => seteditAuthor(e.target.value)}
          placeholder="Autor"
        />

       <div className="number-group">
  <div>
    <label>Liczba egzemplarzy</label>
    <input
      type="number"
      value={editTotalCopies}
      onChange={(e) => setEditTotalCopies(e.target.value)}
    />
  </div>


</div>
<div className="edit-modal-buttons">
  <button type="submit">Zapisz zmiany</button>

  <button
    type="button"
    onClick={() => setEditingBook(null)}
  >
    Anuluj
  </button>
</div>
      </form>
    </div>
  </div>
)}


    </section>
  );


}

export default BooksPage;