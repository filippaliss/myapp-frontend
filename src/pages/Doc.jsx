import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:3001/api/docs/${id}`)
        .then(res => res.json())
        .then(data => setDoc(data));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (id) {
      await fetch(`http://localhost:3001/api/docs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc)
      });
    } else {
      const res = await fetch("http://localhost:3001/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc)
      });
      const data = await res.json();
      navigate(`/doc/${data.id}`);
    }
  };

  return (
    <div>
      <h2>Dokument</h2>
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
