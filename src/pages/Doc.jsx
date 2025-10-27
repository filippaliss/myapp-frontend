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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentLine, setCurrentLine] = useState(1);
  const textareaRef = useRef(null);

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

    // NYTT: lyssna på kommentarer i realtid
    socket.on("comment", (comment) => {
      setComments(prev => [...prev, comment]);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // --- Hämta befintliga kommentarer initialt ---
  useEffect(() => {
    if (!id) return;
    async function fetchComments() {
      try {
        const res = await fetch(`${API_BASE}/documents/${id}/comments`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        } else {
          console.warn("Kunde inte hämta kommentarer");
        }
      } catch (err) {
        console.error("Fel vid hämtning av kommentarer:", err);
      }
    }
    fetchComments();
  }, [id, token]);

  // --- Räkna ut aktuell rad i textarea ---
  function updateCurrentLine() {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart || 0;
    const before = ta.value.slice(0, pos);
    const line = before.split("\n").length;
    setCurrentLine(line);
  }

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

  //funktion: skicka inbjudan
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch(`${API_BASE}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, documentId: id }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteStatus("✅ Inbjudan skickad till " + inviteEmail);
        setInviteEmail("");
      } else {
        throw new Error(data.error || "Kunde inte skicka inbjudan");
      }
    } catch (err) {
      console.error(err);
      setInviteStatus("❌ " + err.message);
    }
  };

  // --- Lägg till kommentar ---
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      documentId: id,
      lineNumber: currentLine,
      content: newComment,
      author: token ? "Användare" : "Anonymous",
    };

    // Skicka via socket (server sparar och broadcastar)
    socket.emit("comment", comment);

    setNewComment("");
  };

  if (loading) return <p>Laddar...</p>;
  if (error) return <p>Fel: {error}</p>;

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
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
            ref={textareaRef}
            value={doc.content}
            onChange={handleContentChange}
            onClick={updateCurrentLine}
            onKeyUp={updateCurrentLine}
            onMouseUp={updateCurrentLine}
            rows={15}
          />

          <button type="submit">{id ? "Uppdatera" : "Skapa"}</button>
        </form>

        {/* 🔹 Inbjudningsformulär */}
        {id && (
          <div style={{ marginTop: "2rem" }}>
            <h3>Bjud in redigerare</h3>
            <form onSubmit={handleInvite}>
              <input
                type="email"
                placeholder="E-postadress"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit">Skicka inbjudan</button>
            </form>
            {inviteStatus && <p>{inviteStatus}</p>}
          </div>
        )}
      </div>

      {/* Kommentarspanel (tilläggsfunktion) */}
      <aside style={{
        width: 320,
        padding: "1rem",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.04)"
      }}>
        <h3>Kommentarer</h3>
        <p>Aktuell rad: {currentLine}</p>

        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: "1rem" }}>
          {comments.length === 0 && <p>Inga kommentarer än</p>}
          {comments
            .filter(c => c.lineNumber === currentLine)
            .map(c => (
              <div key={c.id || c._id} style={{ padding: "0.5rem", marginBottom: "0.5rem", background: "#111", borderRadius: 6 }}>
                <div style={{ fontSize: "0.9rem", color: "#aaa" }}>
                  <strong>{c.author}</strong> <span style={{ marginLeft: 8, fontSize: "0.8rem" }}>{new Date(c.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 6 }}>{c.content}</div>
                <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 6 }}>Rad {c.lineNumber}</div>
              </div>
            ))}
        </div>

        <form onSubmit={handleAddComment}>
          <input
            type="text"
            placeholder="Skriv kommentar för aktuell rad..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" style={{ marginTop: 8 }}>Skicka</button>
        </form>
      </aside>
    </div>
  );
}
