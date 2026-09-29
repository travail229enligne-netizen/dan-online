import { useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Mot de passe oublié</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
          Indique l'email associé à ton compte, on t'enverra un lien pour choisir un nouveau mot de passe.
        </p>

        {sent ? (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📧</div>
            <p style={{ fontSize: 14 }}>
              Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé. Vérifie ta boîte mail (et tes spams).
            </p>
            <a href="/connexion" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600 }}>
              Retour à la connexion
            </a>
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
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
            {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
            <p style={{ fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
              <a href="/connexion" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Retour à la connexion</a>
            </p>
          </form>
        )}

        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 16, textAlign: "center" }}>
          Ton compte n'a pas d'email ? Contacte le support pour récupérer l'accès.
        </p>
      </main>
    </>
  );
}
