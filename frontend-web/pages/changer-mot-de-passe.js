import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function ChangerMotDePasse() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de changer le mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>
            <a href="/connexion" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Connecte-toi</a> pour accéder à cette page.
          </p>
        </main>
      </>
    );
  }

  if (!user.hasPassword) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 16 }}>Mot de passe</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
            Ton compte n'a pas encore de mot de passe (connexion via Google). Va sur ton compte pour en définir un d'abord.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Changer mon mot de passe</h1>

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
            <p style={{ fontSize: 14 }}>Ton mot de passe a bien été modifié.</p>
            <button className="btn-primary" onClick={() => router.push("/compte")} style={{ marginTop: 16 }}>
              Retour à mon compte
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
              Mot de passe actuel
              <input
                required
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Nouveau mot de passe
              <input
                required
                type={showPasswords ? "text" : "password"}
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Confirme le nouveau mot de passe
              <input
                required
                type={showPasswords ? "text" : "password"}
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              Afficher les mots de passe
            </label>
            {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Changer le mot de passe"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
