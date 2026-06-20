import { useEffect, useState } from "react";
import { getMyBorrowings, returnBook, cancelReservation } from "../api/api";
import { toast } from "react-toastify";


function MyBorrowingsPage() {
  const [borrowings, setBorrowings] = useState([]);
  const [filter, setFilter] = useState("all");

  const filteredBorrowings = borrowings.filter((item) => {
    if (filter === "unreturned") {
      return !item.returned_at && !item.is_reservation;
    }

    if (filter === "reserved") {
      return item.is_reservation;
    }

    return true;
  });

  useEffect(() => {
    const fetchBorrowings = async () => {
      const data = await getMyBorrowings();
      setBorrowings(data);
    };

    fetchBorrowings();
  }, []);

  const handleReturnBook = async (borrowID) => {
    await returnBook(borrowID);

    const data = await getMyBorrowings();
    setBorrowings(data);
  };


  const handleCancelReservation = async (reservationId) => {
  try {
    const data = await cancelReservation(reservationId);

    const updatedData = await getMyBorrowings();
    setBorrowings(updatedData);

    toast.success(data.message);
  } catch (err) {
    toast.error(err.message);
  }
};

  return (
    <section className="books-section borrowings-page">
      <div className="borrowings-header">
        <div>
          <h2>Moje wypożyczenia</h2>
          <p className="borrowings-summary">
            Wyświetlonych: {filteredBorrowings.length} / {borrowings.length}
          </p>
        </div>
        <div className="filter-buttons">
  <button
    className={`filter-button ${filter === "all" ? "active" : ""}`}
    onClick={() => setFilter("all")}
  >
    Wszystkie
  </button>

  <button
    className={`filter-button ${filter === "unreturned" ? "active" : ""}`}
    onClick={() => setFilter("unreturned")}
  >
    Nieoddane
  </button>

  <button
    className={`filter-button ${filter === "reserved" ? "active" : ""}`}
    onClick={() => setFilter("reserved")}
  >
    Zarezerwowane
  </button>
</div>
      </div>
{filteredBorrowings.map((item) => (
  <div className="borrow-card" key={`${item.is_reservation ? "r" : "b"}-${item.id}`}>
    <div className="borrow-card-top">
      <div>
        <h3>{item.title}</h3>
        <p className="subtitle">Autor: {item.author}</p>
      </div>

      <span
        className={`status-badge ${
          item.is_reservation
            ? "reserved"
            : item.returned_at
            ? "returned"
            : "unreturned"
        }`}
      >
        {item.is_reservation
          ? "Zarezerwowana"
          : item.returned_at
          ? "Oddana"
          : "Wypożyczona"}
      </span>
    </div>

    {item.is_reservation ? (
  <>
    <p>
      Zarezerwowano:{" "}
      {new Date(item.reserved_at).toLocaleDateString()}
    </p>

    <button
      className="return-button"
      onClick={() => handleCancelReservation(item.id)}
    >
      Anuluj rezerwację
    </button>
  </>
) : (
      <>
        <p>
          Wypożyczono:{" "}
          {new Date(item.borrowed_at).toLocaleDateString()}
        </p>

        {item.returned_at && (
          <p>
            Oddana:{" "}
            {new Date(item.returned_at).toLocaleDateString()}
          </p>
        )}

        {!item.returned_at && (
          <button
            className="return-button"
            onClick={() => handleReturnBook(item.id)}
          >
            Oddaj teraz
          </button>
        )}
      </>
    )}
  </div>
))}
    </section>
  );
}

export default MyBorrowingsPage;
