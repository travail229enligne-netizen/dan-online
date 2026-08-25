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
  category: "",
  prepTimeMinutes: "",
  isDailySpecial: false,
};

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-soft)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Section({ children }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export default function MerchantProduits() {
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const isRestaurant = shop?.businessType === "restaurant";
  const itemLabel = isRestaurant ? "plat" : "produit";

  const loadData = () => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      api.get(`/products?shop=${r.data._id}`).then((res) => setProducts(res.data.products));
      const shopCat = r.data?.category?._id || r.data?.category || "";
      if (shopCat) {
        setForm((f) => (f.category ? f : { ...f, category: shopCat }));
      }
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
      category: p.category?._id || p.category || "",
      prepTimeMinutes: p.prepTimeMinutes || "",
      isDailySpecial: p.isDailySpecial || false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category: shop?.category?._id || shop?.category || "" });
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

  const previewPrice = form.price ? Number(form.price).toLocaleString("fr-FR") : "—";

  return (
    <MerchantLayout title={isRestaurant ? "Mes plats" : "Mes produits"}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
        {isRestaurant ? "Mes plats" : "Mes produits"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
        Ajoute tes {itemLabel}s un par un, comme des étiquettes sur ton étal.
      </p>

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
          marginTop: 4,
          marginBottom: 4,
        }}>
          Ta boutique est en attente de validation par l'équipe EasyShop. Tu pourras ajouter des {itemLabel}s une fois validée.
        </div>
      )}

      {shop && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
              {editingId ? `Modifier le ${itemLabel}` : `Ajouter un ${itemLabel}`}
            </h2>

            {/* --- Étiquette de prix (aperçu live) --- */}
            <div
              style={{
                position: "relative",
                background: "var(--cream)",
                border: "2px dashed var(--line)",
                borderRadius: 14,
                padding: "20px 18px 18px",
                marginBottom: 18,
                transform: "rotate(-0.6deg)",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -9,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--white)",
                  border: "2px dashed var(--line)",
                }}
              />
              {form.isDailySpecial && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: -6,
                    background: "var(--terracotta)",
                    color: "var(--white)",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    padding: "4px 10px",
                    borderRadius: "4px 0 0 4px",
                  }}
                >
                  ⭐ SPÉCIAL DU JOUR
                </div>
              )}
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {form.images[0] ? (
                  <img
                    src={form.images[0]}
                    alt="Aperçu"
                    style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      background: "var(--white)",
                      border: "1px dashed var(--line)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {isRestaurant ? "🍽️" : "🏷️"}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 16,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {form.name || `Nom du ${itemLabel}...`}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--terracotta-dark)", marginTop: 2 }}>
                    {previewPrice} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>FCFA / {form.unit}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {isRestaurant && form.prepTimeMinutes && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 20, padding: "3px 8px" }}>
                        ⏱ {form.prepTimeMinutes} min
                      </span>
                    )}
                    {form.priceTiers.filter((t) => t.minQty && t.price).length > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 20, padding: "3px 8px" }}>
                        {form.priceTiers.filter((t) => t.minQty && t.price).length} palier{form.priceTiers.length > 1 ? "s" : ""} de gros
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <Section>
                <Eyebrow>L'essentiel</Eyebrow>
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
              </Section>

              <Section>
                <Eyebrow>Prix, stock & catégorie</Eyebrow>
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
                <label style={{ fontSize: 12 }}>
                  Catégorie
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                  >
                    <option value="">Choisir...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </Section>

              {isRestaurant && (
                <Section>
                  <Eyebrow>🍽️ Spécial restaurant</Eyebrow>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ fontSize: 12, flex: 1, minWidth: 140 }}>
                      Temps de préparation (min)
                      <input
                        type="number"
                        placeholder="ex: 20"
                        value={form.prepTimeMinutes}
                        onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                        style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isDailySpecial: !form.isDailySpecial })}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `2px solid ${form.isDailySpecial ? "var(--terracotta)" : "var(--line)"}`,
                        background: form.isDailySpecial ? "var(--terracotta)" : "var(--white)",
                        color: form.isDailySpecial ? "var(--white)" : "var(--ink)",
                        fontWeight: 700,
                        fontSize: 12,
                        marginTop: 16,
                      }}
                    >
                      ⭐ Plat du jour {form.isDailySpecial ? "✓" : ""}
                    </button>
                  </div>
                </Section>
              )}

              <Section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Eyebrow>Vente en gros / demi-gros</Eyebrow>
                  <button
                    type="button"
                    onClick={addTier}
                    style={{ fontSize: 12, color: "var(--ink)", fontWeight: 700, textDecoration: "underline", marginTop: -12 }}
                  >
                    + Ajouter un palier
                  </button>
                </div>
                {form.priceTiers.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: -4 }}>
                    Aucun palier. Le {itemLabel} sera vendu au prix détail quelle que soit la quantité.
                  </p>
                )}
                {form.priceTiers.map((tier, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      background: "var(--cream)",
                      borderRadius: 10,
                      padding: 8,
                    }}
                  >
                    <input
                      type="number"
                      placeholder="À partir de (qté)"
                      value={tier.minQty}
                      onChange={(e) => updateTier(i, "minQty", e.target.value)}
                      style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, background: "var(--white)" }}
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={tier.price}
                      onChange={(e) => updateTier(i, "price", e.target.value)}
                      style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, background: "var(--white)" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      aria-label="Retirer ce palier"
                      style={{ fontSize: 16, color: "var(--terracotta-dark)", padding: "0 6px", fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </Section>

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

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
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
