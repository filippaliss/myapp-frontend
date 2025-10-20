import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE from "../config.js";

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    console.log("Id från URL:", id); // Här loggas id
    if (id) {
      setLoading(true);
      async function fetchDoc() {
        try {
          const res = await fetch(`${API_BASE}/documents/${id}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            }
          });
          if (!res.ok) throw new Error("Kunde inte hämta dokument");
          const data = await res.json();
          setDoc(data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          setError(err.message);
          setLoading(false);
        }
      }
      fetchDoc();
    } else {
      setLoading(false);
    }
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${API_BASE}/documents/${id}`
        : `${API_BASE}/documents/`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(doc),
      });

      if (!res.ok) throw new Error("Kunde inte spara dokument");
      const data = await res.json();

      if (!id) navigate(`/doc/${data._id || data.id}`);
      else setDoc(data);
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
