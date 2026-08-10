import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function Conversation() {
  const router = useRouter();
  const { shopId } = router.query;
  const { user, loading } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [shopName, setShopName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!shopId || loading || !user) return;
    api.post(`/messages/start/${shopId}`).then((r) => {
      setConversationId(r.data._id);
    });
    api.get(`/shops/${shopId}`).catch(() => {});
  }, [shopId, loading, user]);

  const load = () => {
    if (!conversationId) return;
    api.get(`/messages/${conversationId}`).then((r) => {
      setMessages(r.data.messages);
      setShopName(r.data.conversation.shop?.name || "");
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${conversationId}`, { text });
      setText("");
      load();
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Connecte-toi pour envoyer un message.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>{shopName || "Conversation"}</h1>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 10 }}>
          {messages.map((m) => {
            const isMine = m.senderRole === (user.role === "client" ? "client" : "marchand");
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
                {m.text}
              </div>
            );
          })}
          {messages.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginTop: 20 }}>
              Aucun message pour l'instant. Dis bonjour !
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
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
