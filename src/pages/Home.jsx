import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE from "../config.js";

export default function Home() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Kolla om användaren har en token (är inloggad)
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); // skicka till login om inte inloggad
      return;
    }

    // Hämta dokument för användaren
    async function fetchdocs() {
      try {
        const res = await fetch(`${API_BASE}/documents`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (res.status === 401 || res.status === 403) {
          // Ogiltig token, tvinga logga in igen
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const data = await res.json();
        console.log("Hämtade dokument:", data);
        setDocs(data);
        setLoading(false);
      } catch (err) {
        console.error("Fel vid hämtning av dokument:", err);
        setLoading(false);
      }
    }
    fetchdocs();
  }, [navigate]);

  if (loading) return <p>Laddar...</p>;

  return (
    <div>
      <h2>Dina dokument</h2>
      <Link to="/new" className="button">➕ Skapa nytt dokument</Link>
      <div className="doc-list">
        {docs.length > 0 ? (
          docs.map(doc => (
            <h3 key={doc.id}>
              <Link to={`/doc/${doc.id}`}>{doc.title || "(Namnlöst dokument)"}</Link>
            </h3>
          ))
        ) : (
          <p>Du har inga dokument än.</p>
        )}
      </div>
    </div>
  );
}
