import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="hero">
      <h2>Witaj w systemie bibliotecznym</h2>
      <p>
        Przeglądaj książki, sprawdzaj dostępność i korzystaj z aplikacji
        mobilnej, aby znaleźć najbliższą bibliotekę.
      </p>
      <Link className="hero-button" to="/books">
        Zobacz katalog książek
      </Link>

<div className="map-container">
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d19577.261953785484!2d20.771395218871856!3d52.16782537162136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471935ea941517d1%3A0x5cc653fdbf81d69!2sKsi%C4%85%C5%BCnica%20Pruszkowska%20im.%20Henryka%20Sienkiewicza!5e0!3m2!1spl!2spl!4v1780931516895!5m2!1spl!2spl"
  width="400"
  height="300"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
      </div>
    </main>
  );
}

export default HomePage;