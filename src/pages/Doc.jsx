import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API_BASE from "../config.js";

let socket;

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const SERVER_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://jsramverk-editor-lisd22.azurewebsites.net";


  const typingTimeout = useRef(null);

  // --- Fetch document ---
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    async function fetchDoc() {
      try {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
          headers: { "Authorization": `Bearer ${token}` },
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
  }, [id, token]);

  // --- Socket.IO setup ---
  useEffect(() => {
  if (!id) return;

  socket = io(SERVER_URL, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO, joining room:", id);
    socket.emit("create", id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  socket.on("doc", (data) => {
    console.log("📄 Received update:", data);
    setDoc(prev => ({ ...prev, content: data.html }));
  });

  return () => {
    socket.disconnect();
  };
}, [id]);

  // --- Handle live typing with debounce ---
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setDoc(prev => ({ ...prev, content: newContent }));

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("doc", { _id: id, html: newContent });
    }, 300);
  };

  // --- Handle form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `${API_BASE}/documents/${id}` : `${API_BASE}/documents/`;

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

      if (!id) {
        navigate(`/doc/${data._id || data.id}`);
        socket.emit("create", data._id); // join room for new doc
      } else {
        setDoc(data);
        socket.emit("create", data._id); // re-join room just in case
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
          onChange={handleContentChange}
        />

        <button type="submit">{id ? "Uppdatera" : "Skapa"}</button>
      </form>
    </div>
  );
}
