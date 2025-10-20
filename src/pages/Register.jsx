import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config.js";
import "../assets/auth.css";


export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Lösenorden matchar inte");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registrering misslyckades");

      // ✅ Spara token direkt så användaren är inloggad
      localStorage.setItem("token", data.token);

      // 🔗 Kolla om användaren kom via inbjudningslänk
      const params = new URLSearchParams(window.location.search);
      const invite = params.get("invite");
      if (invite) {
        navigate(`/doc/${invite}`);
      } else {
        navigate("/new");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h2>Registrera konto</h2>
      <form onSubmit={handleRegister}>
        <label>E-post</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.se"
          required
        />

        <label>Lösenord</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minst 6 tecken"
          required
        />

        <label>Bekräfta lösenord</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Upprepa lösenordet"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registrerar..." : "Skapa konto"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        Har du redan ett konto?{" "}
        <a href="/myapp-frontend/login">Logga in här</a>
      </p>
    </div>
  );
}
