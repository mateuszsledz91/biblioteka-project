

function BookCard({
  id,
  title,
  author,
  availableCopies,
  onBorrow,
  isAdmin,
  onEdit,
  onReserve
}) {
 

  

    return (
    <div className="book-card">


      <h3>{title}</h3>

      <p>Autor: {author}</p>
      
      <p>Dostępne sztuki: {availableCopies}</p>
      <span className={`status ${availableCopies > 0 ? "available" : "unavailable"}`}>
  {availableCopies > 0 ? "Dostępna" : "Niedostępna"}
</span>
      <p>Id: {id}</p>
      {availableCopies > 0 ? (
  <button onClick={() => onBorrow(id)}>
    Wypożycz
  </button>
) : (
  <button onClick={() => onReserve(id)}>
    Zarezerwuj
  </button>
)}
{isAdmin && (
        <button onClick={onEdit}>
          Edytuj
        </button>
      )}


    </div>
  );
}

export default BookCard;