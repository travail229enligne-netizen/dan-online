import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function MerchantDashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", unit: "unité" });
  const [error, setError] = useState("");

  const loadData = () => {
    api.get("/shops/me/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/products?shop=me").then((r) => setProducts(r.data.products)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setForm({ name: "", price: "", stock: "", unit: "unité" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du produit.");
    }
  };

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Tableau de bord marchand</h1>

      {/* Cartes de statistiques */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Commandes", value: stats?.nbCommandes ?? "—" },
          { label: "Ventes totales", value: stats ? `${stats.totalVentes.toLocaleString("fr-FR")} FCFA` : "—" },
          { label: "Commission plateforme", value: stats ? `${stats.totalCommission.toLocaleString("fr-FR")} FCFA` : "—" },
          { label: "Revenu net", value: stats ? `${stats.revenuNet.toLocaleString("fr-FR")} FCFA` : "—" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: "var(--green-dark)" }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      {/* Formulaire d'ajout de produit */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Ajouter un produit</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label style={{ fontSize: 12 }}>
            Nom du produit
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Prix (FCFA)
            <input
              required
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Stock
            <input
              required
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Unité
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <button className="btn-primary" type="submit">
            Ajouter
          </button>
        </form>
        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </section>

      {/* Liste des produits */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Mes produits ({products.length})</h2>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
          {products.map((p, i) => (
            <div
              key={p._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 14,
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Stock : {p.stock} {p.unit}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: "var(--terracotta-dark)" }}>
                {p.price.toLocaleString("fr-FR")} FCFA
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--ink-soft)" }}>Aucun produit pour l'instant.</div>
          )}
        </div>
      </section>
    </main>
  );
}
