import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

export default function AdminLivreurs() {
  const { user, loading } = useAuth();
  const [couriers, setCouriers] = useState(undefined);
  const [form, setForm] = useState({ phone: "", name: "" });
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = () => {
    api.get("/platform-couriers").then((r) => setCouriers(r.data)).catch(() => setCouriers([]));
  };

  useEffect(() => {
    if (!loading && user?.role === "admin") load();
  }, [loading, user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      await api.post("/admin/platform-couriers", form);
      setForm({ phone: "", name: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter ce livreur.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Retirer ce livreur de la liste Shopizzy ?")) return;
    setBusy(userId);
    try {
      await api.delete(`/admin/platform-couriers/${userId}`);
      load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return null;

  if (!user || user.role !== "admin") {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Accès réservé aux administrateurs.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>Livreurs Shopizzy</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
          Ajoute les livreurs disponibles pour tous les marchands, à partir de leur numéro de téléphone.
          Ils doivent déjà avoir un compte Shopizzy.
        </p>

        <form
          onSubmit={handleAdd}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 24,
            boxSizing: "border-box",
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Numéro de téléphone du livreur
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="ex: 0197000000"
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 14, fontSize: 15, boxSizing: "border-box" }}
            />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Nom à afficher (optionnel)
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Moussa le livreur"
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 14, fontSize: 15, boxSizing: "border-box" }}
            />
          </label>

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14, margin: 0 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={adding} style={{ fontSize: 15, padding: 14 }}>
            {adding ? "Ajout..." : "Ajouter ce livreur"}
          </button>
        </form>

        <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
          Livreurs Shopizzy {couriers && `(${couriers.length})`}
        </h2>

        {couriers === undefined && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}

        {couriers && couriers.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun livreur Shopizzy ajouté pour l'instant.</p>
        )}

        {couriers && couriers.length > 0 && (
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
            {couriers.map((c, i) => (
              <div
                key={c.user}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  borderTop: i > 0 ? "1px solid var(--line)" : "none",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.phone}</div>
                </div>
                <button
                  onClick={() => handleRemove(c.user)}
                  disabled={busy === c.user}
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    color: "var(--terracotta-dark)",
                    background: "var(--white)",
                    fontWeight: 600,
                  }}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
