import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { toast } from "react-toastify";

function LoginPage() {
 
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");


const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const data = await loginUser({ email, password });

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);

    toast.success("Zalogowano pomyślnie.");

    setTimeout(() => {
      window.location.href = "/";
    }, 1000);

  } catch (err) {
    toast.error(err.message);
  }
};
 
 return (
  <main className="auth-page">
    <div className="auth-card">
      <h2>Logowanie</h2>
      <p>Zaloguj się do systemu biblioteki</p>

      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Zaloguj</button>
      </form>

      <Link to="/register" className="auth-link">
        Nie masz konta? Zarejestruj się
      </Link>
    </div>
  </main>
);
}

export default LoginPage;