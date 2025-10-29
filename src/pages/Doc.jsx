import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import API_BASE from "../config.js";

let socket;

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);

  // --- Hämta token ---
  const token = localStorage.getItem("token"); // ← behåll för inbjudningar
  const authToken = token; // bara vanlig auth, ingen invite-token

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
          headers: { "Authorization": `Bearer ${authToken}` },
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
  }, [id, authToken]);

  // --- Socket.IO setup ---
  useEffect(() => {
    if (!id) return;

    socket = io(SERVER_URL, {
      withCredentials: true,
      auth: { token: authToken }, // skicka token till backend
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
  }, [id, authToken]);

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
          "Authorization": `Bearer ${authToken}`,
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

  // --- Funktion: skicka inbjudan ---
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus("📨 Skickar inbjudan...");

    try {
      const res = await fetch(`${API_BASE}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // admin-token
        },
        body: JSON.stringify({ email: inviteEmail, documentId: id }),
      });

      if (!res.ok) throw new Error(`Serverfel (${res.status})`);

      const data = await res.json();

      if (data.success && data.status === "queued") {
        // Visa queued-status direkt
        setInviteStatus(`⚙️ Inbjudan bearbetas och kommer att skickas till ${inviteEmail}`);
        setInviteEmail("");

        // Byt till skickad efter 1 minut
        setTimeout(() => {
          setInviteStatus(`✅ Inbjudan skickad till ${inviteEmail}`);
        }, 60 * 1000); // 60 sekunder
      } else if (data.success) {
        setInviteStatus(`✅ Inbjudan skickad till ${inviteEmail}`);
        setInviteEmail("");
      } else {
        throw new Error(data.error || "Kunde inte skicka inbjudan");
      }

    } catch (err) {
      console.error("❌ Fel vid inbjudan:", err);
      setInviteStatus("❌ " + err.message);
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
  );
}
