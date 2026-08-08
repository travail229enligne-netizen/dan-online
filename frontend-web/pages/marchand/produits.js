import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import ImageUpload from "../../components/ImageUpload";
import api from "../../lib/api";

export default function MerchantProduits() {
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", unit: "unité", image: "" });
  const [error, setError] = useState("");

  const loadData = () => {
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      api.get(`/products?shop=${r.data._id}`).then((res) => setProducts(res.data.products));
    }).catch(() => setShop(null));
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
      setForm({ name: "", price: "", stock: "", unit: "unité", image: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du produit.");
    }
  };

  if (shop === undefined) {
    return (
      <MerchantLayout title="Mes produits">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Mes produits">
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Mes produits</h1>

      {shop === null && (
        <div style={{
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          padding: 18,
          textAlign: "center",
          marginTop: 16,
        }}>
          <p style={{ marginBottom: 12, color: "var(--ink-soft)" }}>
            Tu n'as pas encore configuré ta boutique.
          </p>
          <a href="/marchand/boutique" className="btn-primary" style={{ display: "inline-block" }}>
            Configurer ma boutique
          </a>
        </div>
      )}

      {shop && shop.status === "pending" && (
        <div style={{
          background: "#FDF3E7",
          border: "1px solid var(--gold)",
          borderRadius: "var(--radius-md)",
          padding: 14,
          fontSize: 13,
          marginTop: 12,
          marginBottom: 4,
        }}>
          Ta boutique est en attente de validation par l'équipe Dan-Online. Tu pourras ajouter des produits une fois validée.
        </div>
      )}

      {shop && (
        <>
          <section style={{ marginTop: 24 }}>
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
              <ImageUpload
                label="Photo du produit"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
              />

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

              <button className="btn-primary" disabled={shop.status !== "active"}>
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
                    alignItems: "center",
                    gap: 12,
                    justifyContent: "space-between",
                    padding: 14,
                    borderTop: i > 0 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--cream)", border: "1px solid var(--line)" }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Stock: {p.stock} {p.unit}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--terracotta-dark)" }}>
                    {p.price.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: "var(--ink-soft)" }}>
                  Aucun produit pour l'instant.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </MerchantLayout>
  );
}
