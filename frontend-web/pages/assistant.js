import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import api from "../lib/api";

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Salut 👋 Dis-moi ce que tu cherches — un produit, un budget, une ville — et je te trouve les meilleures options sur Shopyz.",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text, products: [] }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/assistant/chat", { message: text, history });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, products: data.products || [], conversationId: data.conversationId },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie dans un instant.", products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 560, paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: 20, marginBottom: 14 }}>🤖 Assistant Shopyz</h1>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "85%",
                  background: m.role === "user" ? "var(--ink)" : "var(--white)",
                  color: m.role === "user" ? "var(--white)" : "var(--ink)",
                  border: m.role === "user" ? "none" : "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>

              {m.products && m.products.length > 0 && (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 8, width: "100%", paddingBottom: 4 }}>
                  {m.products.map((p) => (
                    <a
                      key={p.id}
                      href={`/produit/${p.slug}`}
                      style={{
                        flexShrink: 0,
                        width: 140,
                        background: "var(--white)",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: 100,
                          background: p.image ? `#eee url(${p.image}) center/cover no-repeat` : "#eee",
                        }}
                      />
                      <div style={{ padding: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--terracotta-dark)", marginTop: 2 }}>
                          {p.price.toLocaleString("fr-FR")} FCFA
                        </div>
                        <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 2 }}>
                          {p.shopVerified ? "✓ " : ""}
                          {p.shopName}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {m.conversationId && (
                <a
                  href={`/messages/c/${m.conversationId}`}
                  style={{ fontSize: 12, color: "var(--terracotta-dark)", fontWeight: 600, marginTop: 6 }}
                >
                  Voir la conversation →
                </a>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: "flex-start", background: "var(--white)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px", fontSize: 14, color: "var(--ink-soft)" }}>
              ...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: un jean à 15000f vers Calavi"
            style={{ flex: 1, padding: 12, border: "1px solid var(--line)", borderRadius: 12, fontSize: 14, boxSizing: "border-box" }}
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "12px 18px" }}>
            Envoyer
          </button>
        </form>
      </main>
    </>
  );
}
