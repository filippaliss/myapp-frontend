import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../config.js";


export default function Home() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/documents`)
      .then(res => res.json())
      .then(data => setDocs(data));
  }, []);

  return (
    <div>
      <h2>Dokument</h2>
      <Link to="/new" className="button">➕ Skapa nytt dokument</Link>
      {docs.map(doc => (
        <h3 key={doc.id}>
          <Link to={`/doc/${doc.id}`}>{doc.title}</Link>
        </h3>
      ))}
    </div>
  );
}
