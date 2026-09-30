import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import api from "../lib/api";

export default function ReinitialiserMotDePasse() {
  const router = useRouter();
  const { id, token } = router.query;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!id || !token) {
      setError("Lien invalide. Refais une demande de réinitialisation.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { id, token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de réinitialiser le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Nouveau mot de passe</h1>

        {done ? (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 14 }}>Ton mot de passe a bien été réinitialisé.</p>
            <a href="/connexion" className="btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
              Se connecter
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
              Nouveau mot de passe
              <div style={{ position: "relative", marginTop: 4 }}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: 10, paddingRight: 40, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    fontSize: 16,
                    padding: 4,
                    color: "var(--ink-soft)",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>
            <label style={{ fontSize: 12 }}>
              Confirme le mot de passe
              <div style={{ position: "relative", marginTop: 4 }}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: "100%", padding: 10, paddingRight: 40, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
                />
              </div>
            </label>
            {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
