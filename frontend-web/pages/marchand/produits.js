import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import ImageUploadMulti from "../../components/ImageUploadMulti";
import api from "../../lib/api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  unit: "unité",
  images: [],
  priceTiers: [],
  prepTimeMinutes: "",
  isDailySpecial: false,
};

export default function MerchantProduits() {
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const isRestaurant = shop?.businessType === "restaurant";
  const itemLabel = isRestaurant ? "plat" : "produit";
  const itemLabelCap = isRestaurant ? "Plat" : "Produit";

  const loadData = () => {
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      api.get(`/products?shop=${r.data._id}`).then((res) => setProducts(res.data.products));
    }).catch(() => setShop(null));
  };

  useEffect(() => {
    loadData();
  }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      images: p.images || [],
      priceTiers: p.priceTiers || [],
      prepTimeMinutes: p.prepTimeMinutes || "",
      isDailySpecial: p.isDailySpecial || false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const addTier = () => {
    setForm({ ...form, priceTiers: [...form.priceTiers, { minQty: "", price: "" }] });
  };

  const updateTier = (index, field, value) => {
    const tiers = [...form.priceTiers];
    tiers[index] = { ...tiers[index], [field]: value };
    setForm({ ...form, priceTiers: tiers });
  };

  const removeTier = (index) => {
    setForm({ ...form, priceTiers: form.priceTiers.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cleanTiers = form.priceTiers
        .filter((t) => t.minQty && t.price)
        .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }));

      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        priceTiers: cleanTiers,
        prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : null,
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      cancelEdit();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors de l'enregistrement du ${itemLabel}.`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irreversible.`)) return;
    setBusy(id);
    try {
      await api.delete(`/products/${id}`);
      loadData();
    } finally {
      setBusy(null);
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
    <MerchantLayout title={isRestaurant ? "Mes plats" : "Mes produits"}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{isRestaurant ? "Mes plats" : "Mes produits"}</h1>

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
          Ta boutique est en attente de validation par l'équipe EasyShop. Tu pourras ajouter des {itemLabel}s une fois validée.
        </div>
      )}

      {shop && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>
              {editingId ? `Modifier le ${itemLabel}` : `Ajouter un ${itemLabel}`}
            </h2>
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
              <ImageUploadMulti
                label={`Photos du ${itemLabel}`}
                values={form.images}
                onChange={(images) => setForm({ ...form, images })}
                max={5}
              />

              <label style={{ fontSize: 12 }}>
                Nom du {itemLabel}
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                />
              </label>

              <label style={{ fontSize: 12 }}>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit" }}
                />
              </label>

              <div style={{ display: "flex", gap: 10 }}>
                <label style={{ fontSize: 12, flex: 1 }}>
                  Prix détail (FCFA)
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

              {isRestaurant && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <label style={{ fontSize: 12, flex: 1 }}>
                    Temps de préparation (minutes)
                    <input
                      type="number"
                      placeholder="ex: 20"
                      value={form.prepTimeMinutes}
                      onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                      style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, paddingBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={form.isDailySpecial}
                      onChange={(e) => setForm({ ...form, isDailySpecial: e.target.checked })}
                    />
                    Plat du jour
                  </label>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Prix par quantité (gros/demi-gros)</span>
                  <button
                    type="button"
                    onClick={addTier}
                    style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}
                  >
                    + Ajouter un palier
                  </button>
                </div>
                {form.priceTiers.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    Aucun palier. Le {itemLabel} sera vendu au prix détail quelle que soit la quantité.
                  </p>
                )}
                {form.priceTiers.map((tier, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <input
                      type="number"
                      placeholder="À partir de (qté)"
                      value={tier.minQty}
                      onChange={(e) => updateTier(i, "minQty", e.target.value)}
                      style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={tier.price}
                      onChange={(e) => updateTier(i, "price", e.target.value)}
                      style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      aria-label="Retirer ce palier"
                      style={{ fontSize: 16, color: "var(--terracotta-dark)", padding: "0 6px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" disabled={shop.status !== "active"} style={{ flex: 1 }}>
                  {editingId ? "Enregistrer les modifications" : "Ajouter"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      background: "var(--white)",
                      fontWeight: 600,
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>
              {isRestaurant ? "Mes plats" : "Mes produits"} ({products.length})
            </h2>
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
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {p.images && p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--cream)", border: "1px solid var(--line)" }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {p.name}
                        {p.isDailySpecial && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "var(--terracotta-dark)" }}>
                            ⭐ PLAT DU JOUR
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        Stock: {p.stock} {p.unit}
                        {p.prepTimeMinutes ? ` · ${p.prepTimeMinutes} min` : ""}
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--terracotta-dark)", fontSize: 13 }}>
                        {p.price.toLocaleString("fr-FR")} FCFA
                        {p.priceTiers?.length > 0 && (
                          <span style={{ fontWeight: 400, fontSize: 11, color: "var(--ink-soft)" }}>
                            {" "}+ {p.priceTiers.length} palier{p.priceTiers.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => startEdit(p)}
                      style={{
                        fontSize: 12,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        background: "var(--white)",
                        fontWeight: 600,
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      disabled={busy === p._id}
                      style={{
                        fontSize: 12,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        color: "var(--terracotta-dark)",
                        background: "var(--white)",
                        fontWeight: 600,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: "var(--ink-soft)" }}>
                  Aucun {itemLabel} pour l'instant.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </MerchantLayout>
  );
}
