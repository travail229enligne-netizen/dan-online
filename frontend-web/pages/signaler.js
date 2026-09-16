import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function Signaler() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.post("/reports", { subject, message });
      setSent(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer le signalement.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  if (!user) {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 480, paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>🚩 Signaler un problème</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 24, lineHeight: 1.6 }}>
          Décris le problème rencontré. Ton signalement sera transmis directement à l'équipe
          Shopyz pour être examiné.
        </p>

        {sent ? (
          <div
            style={{
              background: "var(--cream)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              Ton signalement a bien été envoyé. Merci !
            </p>
            <button className="btn-primary" onClick={() => setSent(false)}>
              Envoyer un autre signalement
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <label style={{ fontSize: 12 }}>
              Sujet
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : Boutique suspecte, bug, litige..."
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Description du problème
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explique le plus précisément possible ce qui s'est passé..."
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
              />
            </label>
            {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={sending}>
              {sending ? "Envoi..." : "Envoyer le signalement"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
