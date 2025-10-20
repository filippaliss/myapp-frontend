import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // ta bort JWT-token
    navigate("/login"); // skicka användaren till login
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <header>
      <h1>📄 Dokumentredigeraren</h1>
      <nav>
        <Link to="/">Hem</Link>{" | "}
        {isLoggedIn ? (
          <>
            <Link to="/new">Nytt dokument</Link>{" | "}
            <button onClick={handleLogout} className="button">Logga ut</button>
          </>
        ) : (
          <>
            <Link to="/login">Logga in</Link>{" | "}
            <Link to="/register">Registrera</Link>
          </>
        )}
      </nav>
    </header>
  );
}
