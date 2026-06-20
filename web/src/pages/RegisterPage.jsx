import { useState } from "react";
import { registerUser, loginUser } from "../api/api";
import { toast } from "react-toastify";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const user = {
        username,
        email,
        password,
      };

      await registerUser(user);

      toast.success("Konto zostało utworzone.");

      const loginData = await loginUser({
        email,
        password,
      });

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("role", loginData.role);

      toast.success("Zalogowano.");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);

    } catch (err) {
      toast.error(err.message || "Nie udało się zarejestrować.");
    }
  };

return (
  <main className="auth-page">
    <div className="auth-card">
      <h2>Rejestracja</h2>
      <p>Utwórz konto w systemie biblioteki</p>

      <form onSubmit={handleRegister} className="auth-form">
        <input
          type="text"
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button type="submit">Zarejestruj</button>
      </form>
    </div>
  </main>
);
}

export default RegisterPage;