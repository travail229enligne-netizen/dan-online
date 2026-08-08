import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

export default function MerchantDashboard() {
  const [shop, setShop] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", unit: "unité" });
  const [error, setError] = useState("");

  const loadData = () => {
    api.get("/shops/me").then((r) => setShop(r.data)).catch(() => setShop(null));
    api.get("/shops/me/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/shops/me").then((r) => {
      if (r.data) {
        api.get(`/products?shop=${r.data._id}`).then((res) => setProducts(res.data.products));
      }
    });
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
    <MerchantLayout title="Tableau de bord">
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>
        {shop ? `Bonjour, ${shop.name}` : "Tableau de bord"}
      </h1>

      {shop === null && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          <p style={{ marginBottom: 12, color: "var(--ink-soft)" }}>
            Tu n'as pas encore configuré ta boutique.
          </p>
          <a href="/marchand/boutique" className="btn-primary" style={{ display: "inline-block" }}>
            Configurer ma boutique
          </a>
        </div>
      )}

      {shop && shop.status === "pending" && (
        <div
          style={{
            background: "#FDF3E7",
            border: "1px solid var(--gold)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            fontSize: 13,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          ⏳ Ta boutique est en attente de validation par l'équipe Dan-Online. Tu pourras ajouter des produits une fois validée.
        </div>
      )}

      {shop && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
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
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--green-dark)" }}>
                  {card.value}
                </div>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Ajouter un produit</h2>
            <form
              onSubmit={handleSubmit}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <label style={{ fontSize: 12 }}>
                Nom du produit
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                />
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <label style={{ fontSize: 12, flex: 1 }}>
                  Prix (FCFA)
                  <input
                    required
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                </label>
                <label style={{ fontSize: 12, flex: 1 }}>
                  Stock
                  <input
                    required
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                </label>
                <label style={{ fontSize: 12, flex: 1 }}>
                  Unité
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                </label>
              </div>
              {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" type="submit" disabled={shop.status !== "active"}>
                Ajouter
              </button>
            </form>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Mes produits ({products.length})</h2>
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
        </>
      )}
    </MerchantLayout>
  );
}
