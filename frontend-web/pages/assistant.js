import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import api from "../lib/api";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/op1wrztj/image/upload";
const CLOUDINARY_PRESET = "dan-online";

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Salut 👋 Dis-moi ce que tu cherches — un produit, un budget, une ville — et je te trouve les meilleures options sur Shopyz. Tu peux aussi m'envoyer une photo ou utiliser le micro.",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setPendingImage(data.secure_url);
      }
    } catch (err) {
      alert("Impossible d'envoyer l'image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text || "📷 Photo envoyée", products: [], image: pendingImage },
    ]);
    const imageToSend = pendingImage;
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const { data } = await api.post("/assistant/chat", {
        message: text || "Voici une photo du produit que je cherche.",
        history,
        imageUrl: imageToSend || undefined,
      });
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
              {m.image && (
                <img
                  src={m.image}
                  alt=""
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, marginBottom: 6 }}
                />
              )}
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

        {pendingImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            <img src={pendingImage} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Image prête à envoyer</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              style={{ fontSize: 16, color: "var(--terracotta-dark)", padding: "0 6px" }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            aria-label="Joindre une photo"
            style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid var(--line)", background: "var(--white)", fontSize: 18, flexShrink: 0 }}
          >
            {uploadingImage ? "..." : "📷"}
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Parler"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: listening ? "var(--terracotta)" : "var(--white)",
              color: listening ? "var(--white)" : "var(--ink)",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🎤
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: un jean à 15000f vers Calavi"
            style={{ flex: 1, minWidth: 0, padding: 12, border: "1px solid var(--line)", borderRadius: 12, fontSize: 14, boxSizing: "border-box" }}
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "12px 16px", flexShrink: 0 }}>
            Envoyer
          </button>
        </form>
      </main>
    </>
  );
}
