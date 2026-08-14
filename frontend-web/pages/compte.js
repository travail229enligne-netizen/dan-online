import { useState } from "react";
import Header from "../components/Header";
import ImageUpload from "../components/ImageUpload";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function Compte() {
  const { user, loading, logout, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setForm({
      avatarUrl: user.avatarUrl || "",
      bio: user.bio || "",
      locationLabel: user.locationLabel || "",
      locationMapUrl: user.locationMapUrl || "",
      privacy: {
        showPhone: user.privacy?.showPhone || false,
        showLocation: user.privacy?.showLocation || false,
      },
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.put("/auth/me", form);
      if (setUser) setUser(res.data.user);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>
            <a href="/connexion" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Connecte-toi</a> pour accéder à ton compte.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: 420, paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Mon compte</h1>

        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          {!editing ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "var(--cream)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--green-deep)",
                    }}
                  >
                    {user.role === "marchand" ? "Marchand" : user.role === "admin" ? "Administrateur" : "Client"}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{user.email}</div>
              <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{user.phone}</div>
              {user.bio && <p style={{ fontSize: 13, marginTop: 8 }}>{user.bio}</p>}
              <button
                onClick={startEdit}
                style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--ink)", textDecoration: "underline" }}
              >
                Modifier mon profil
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ImageUpload
                label="Photo de profil"
                value={form.avatarUrl}
                onChange={(url) => setForm({ ...form, avatarUrl: url })}
              />
              <label style={{ fontSize: 12 }}>
                Bio (courte présentation)
                <textarea
                  rows={2}
                  maxLength={200}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit" }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Localisation (ville, quartier...)
                <input
                  value={form.locationLabel}
                  onChange={(e) => setForm({ ...form, locationLabel: e.target.value })}
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Lien Google Maps (optionnel)
                <input
                  value={form.locationMapUrl}
                  onChange={(e) => setForm({ ...form, locationMapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                />
              </label>

              <div style={{ background: "var(--cream)", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Confidentialité</div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.privacy.showPhone}
                    onChange={(e) => setForm({ ...form, privacy: { ...form.privacy, showPhone: e.target.checked } })}
                  />
                  Partager mon numéro sur mon profil public
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={form.privacy.showLocation}
                    onChange={(e) => setForm({ ...form, privacy: { ...form.privacy, showLocation: e.target.checked } })}
                  />
                  Partager ma localisation sur mon profil public
                </label>
              </div>

              {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600 }}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href="/commandes"
            style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, fontWeight: 600, fontSize: 14 }}
          >
            Mes commandes
          </a>
          {user.role === "marchand" && (
            <a
              href="/marchand/dashboard"
              style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, fontWeight: 600, fontSize: 14 }}
            >
              Tableau de bord marchand
            </a>
          )}
          {user.role === "admin" && (
            <a
              href="/admin/dashboard"
              style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, fontWeight: 600, fontSize: 14 }}
            >
              Espace administrateur
            </a>
          )}
          <button
            onClick={logout}
            style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, fontWeight: 600, fontSize: 14, color: "var(--terracotta-dark)", textAlign: "left" }}
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}
