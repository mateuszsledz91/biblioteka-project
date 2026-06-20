import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem("username"));
  
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  setUsername(null);

window.location.href = "/";
};
  
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <h1>
          <span>Biblioteka</span>
          <span>Online</span>
        </h1>
      </div>

      <div className="navbar-content">
        <nav className="navbar-links">
          <Link className="nav-link" to="/">Strona główna</Link>
          <Link className="nav-link" to="/books">Książki</Link>
          {username && <Link className="nav-link" to="/myborrowing">Moje Wyporzyczenia</Link>}
        </nav>

        <div className="navbar-actions">
          {username ? (
            <>
              <span className="navbar-user">Zalogowany jako {username}</span>
              <button className="nav-button" onClick={handleLogout}>Wyloguj</button>
            </>
          ) : (
            <>
              <Link className="nav-button" to="/login">Logowanie</Link>
              <Link className="nav-button" to="/register">Rejestracja</Link>
            </>
          )}

          <button
            aria-label={darkMode ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
            className="theme-toggle-button"
            onClick={() => setDarkMode((v) => !v)}
            title={darkMode ? "Jasny motyw" : "Ciemny motyw"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;