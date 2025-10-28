import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import debounce from "lodash.debounce";
import API_BASE from "../config.js";

export default function Doc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);

  const socketRef = useRef(null);

  // --- Hämta token (invite eller vanlig) ---
  const urlHash = location.hash; // t.ex. "#/doc/6900b1bd3121cf9245f0253f?invite=..."
  const hashParts = urlHash.split("?");
  const urlParams = new URLSearchParams(hashParts[1]);
  const inviteToken = urlParams.get("invite");
  const localToken = localStorage.getItem("token");
  const authToken = inviteToken || localToken;

  // --- Backend URL ---
  const SERVER_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://jsramverk-editor-lisd22.azurewebsites.net";

  // --- Fetch document ---
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
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
    };

    fetchDoc();
  }, [id, authToken]);

  // --- Socket.IO setup ---
  useEffect(() => {
    if (!id) return;
    const socketInstance = io(SERVER_URL, {
      withCredentials: true,
      auth: { token: authToken },
    });

    socketInstance.on("connect", () => {
      console.log("✅ Connected to Socket.IO, joining room:", id);
      socketInstance.emit("create", id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socketInstance.on("doc", (data) => {
      setDoc((prev) => ({ ...prev, content: data.html }));
    });

    socketRef.current = socketInstance;

    return () => {
      socketInstance.off("doc");
      socketInstance.disconnect();
    };
  }, [id, authToken]);

  // --- Live typing debounce ---
  const emitChange = useCallback(
    debounce((newContent) => {
      socketRef.current?.emit("doc", { _id: id, html: newContent });
    }, 300),
    [id]
  );

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setDoc((prev) => ({ ...prev, content: newContent }));
    emitChange(newContent);
  };

  // --- Submit form ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `${API_BASE}/documents/${id}` : `${API_BASE}/documents/`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(doc),
      });

      if (!res.ok) throw new Error("Kunde inte spara dokument");
      const data = await res.json();

      if (!id) {
        navigate(`/doc/${data._id || data.id}`);
        socketRef.current?.emit("create", data._id || data.id);
      } else {
        setDoc(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // --- Invite form ---
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus("📨 Skickar inbjudan...");
    const email = inviteEmail; // spara innan reset
    setInviteEmail("");

    try {
      const res = await fetch(`${API_BASE}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localToken}`, // admin-token
        },
        body: JSON.stringify({ email, documentId: id }),
      });

      if (!res.ok) throw new Error(`Serverfel (${res.status})`);

      const data = await res.json();

      if (data.success && data.status === "queued") {
        setInviteStatus(`⚙️ Inbjudan bearbetas och skickas till ${email}`);
        setTimeout(() => {
          setInviteStatus(`✅ Inbjudan skickad till ${email}`);
        }, 60 * 1000);
      } else if (data.success) {
        setInviteStatus(`✅ Inbjudan skickad till ${email}`);
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
