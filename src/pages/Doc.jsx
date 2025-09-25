import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE from "../config.js";

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`${API_BASE}/documents/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Kunde inte hämta dokument");
          return res.json();
        })
        .then(data => {
          setDoc(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });
        if (!res.ok) throw new Error("Kunde inte uppdatera dokument");
        const updated = await res.json();
        setDoc(updated);
      } else {
        const res = await fetch(`${API_BASE}/documents/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });
        if (!res.ok) throw new Error("Kunde inte skapa dokument");
        const data = await res.json();
        navigate(`/doc/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) return <p>Laddar...</p>;
  if (error) return <p>Fel: {error}</p>;

  return (
    <div>
      <h2>{id ? "Redigera dokument" : "Skapa nytt dokument"}</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Titel</label>
        <input
          type="text"
          name="title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
        />

        <label htmlFor="content">Innehåll</label>
        <textarea
          name="content"
          value={doc.content}
          onChange={(e) => setDoc({ ...doc, content: e.target.value })}
        />

        <button type="submit">{id ? "Uppdatera" : "Skapa"}</button>
      </form>
    </div>
  );
}
