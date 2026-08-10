import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/Header";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const CLOUD_NAME = "op1wrztj";
const UPLOAD_PRESET = "dan-online";

function whatsappBase(phone) {
  if (!phone) return null;
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

export default function ConversationById() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const load = () => {
    if (!id) return;
    api.get(`/messages/${id}`).then((r) => {
      setConversation(r.data.conversation);
      setMessages(r.data.messages);
    });
  };

  useEffect(() => {
    if (!loading && user && id) {
      load();
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
    }
  }, [loading, user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${id}`, { text });
      setText("");
      load();
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      await api.post(`/messages/${id}`, { imageUrl: data.secure_url });
      load();
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading || !conversation) return null;

  const title = user.role === "client" ? conversation.shop?.name : conversation.client?.name;
  const phone = user.role === "marchand" ? conversation.client?.phone : conversation.shop?.owner?.phone;
  const waBase = whatsappBase(phone);

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ fontSize: 18 }}>{title || "Conversation"}</h1>
          {waBase && (
            <div style={{ display: "flex", gap: 8 }}>
              <a href={waBase} target="_blank" rel="noreferrer" title="Appel audio via WhatsApp" style={{ fontSize: 18 }}>
                📞
              </a>
              <a href={waBase} target="_blank" rel="noreferrer" title="Appel vidéo via WhatsApp" style={{ fontSize: 18 }}>
                🎥
              </a>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 10 }}>
          {messages.map((m) => {
            const isMine = m.senderRole === user.role;
            return (
              <div
                key={m._id}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  background: isMine ? "var(--ink)" : "var(--white)",
                  color: isMine ? "var(--white)" : "var(--ink)",
                  border: isMine ? "none" : "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "8px 12px",
                  maxWidth: "75%",
                  fontSize: 13,
                }}
              >
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="Image" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: m.text ? 6 : 0, display: "block" }} />
                )}
                {m.text}
              </div>
            );
          })}
          {messages.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginTop: 20 }}>
              Aucun message pour l'instant.
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--line)", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Envoyer une image"
            style={{ fontSize: 20, padding: "6px 8px" }}
          >
            {uploading ? "..." : "📷"}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris un message..."
            style={{ flex: 1, padding: 10, border: "1px solid var(--line)", borderRadius: 20, fontSize: 13 }}
          />
          <button className="btn-primary" disabled={sending || !text.trim()} style={{ borderRadius: 20, padding: "10px 18px" }}>
            Envoyer
          </button>
        </form>
      </main>
    </>
  );
}
