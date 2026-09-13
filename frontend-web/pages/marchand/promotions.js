import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 18,
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid var(--line)",
  borderRadius: 14,
  fontSize: 15,
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 13, fontWeight: 600, display: "flex", flexDirection: "column", gap: 2 };

export default function Promotions() {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState(undefined);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    appliesTo: "all",
    products: [],
    startDate: "",
    endDate: "",
    usageLimit: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = () => {
    api.get("/promotions/me").then((r) => setPromotions(r.data)).catch(() => setPromotions([]));
  };

  useEffect(() => {
    load();
    api
      .get("/shops/me")
      .then((r) => api.get(`/products?shop=${r.data._id}`))
      .then((res) => setProducts(res.data.products))
      .catch(() => {});
  }, []);

  const toggleProduct = (id) => {
    setForm((f) => ({
      ...f,
      products: f.products.includes(id) ? f.products.filter((p) => p !== id) : [...f.products, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/promotions", {
        ...form,
        value: Number(form.value),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      setForm({ code: "", type: "percent", value: "", appliesTo: "all", products: [], startDate: "", endDate: "", usageLimit: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer ce code.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    setBusy(id);
    try {
      await api.put(`/promotions/${id}/toggle`);
      load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce code de réduction ?")) return;
    setBusy(id);
    try {
      await api.delete(`/promotions/${id}`);
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <MerchantLayout title="Promotions">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>Codes de réduction</h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
        Crée un code que tes clients pourront utiliser au panier, valable sur tous tes produits ou une sélection.
      </p>

      <form onSubmit={handleSubmit} style={{ ...card, display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <label style={labelStyle}>
          Code
          <input
            required
            placeholder="ex: PROMO10"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            style={inputStyle}
          />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Type de réduction
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (FCFA)</option>
            </select>
          </label>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Valeur
            <input
              required
              type="number"
              min="1"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          S'applique à
          <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} style={inputStyle}>
            <option value="all">Tous mes produits</option>
            <option value="products">Une sélection de produits</option>
          </select>
        </label>

        {form.appliesTo === "products" && (
          <div style={{ background: "var(--cream)", borderRadius: 12, padding: 10, maxHeight: 220, overflowY: "auto" }}>
            {products.map((p) => (
              <label key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "6px 4px" }}>
                <input type="checkbox" checked={form.products.includes(p._id)} onChange={() => toggleProduct(p._id)} />
                {p.name} — {p.price.toLocaleString("fr-FR")} FCFA
              </label>
            ))}
            {products.length === 0 && <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>Aucun produit trouvé.</p>}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Début (optionnel)
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Fin (optionnel)
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
          </label>
        </div>

        <label style={labelStyle}>
          Limite d'utilisation (optionnel)
          <input
            type="number"
            min="1"
            placeholder="Illimité si vide"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14, margin: 0 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15, padding: 14, borderRadius: 14 }}>
          {saving ? "Création..." : "Créer le code"}
        </button>
      </form>

      <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
        Mes codes {promotions && `(${promotions.length})`}
      </h2>

      {promotions === undefined && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}
      {promotions && promotions.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun code créé pour l'instant.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {promotions?.map((promo) => (
          <div key={promo._id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{promo.code}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {promo.type === "percent" ? `-${promo.value}%` : `-${promo.value.toLocaleString("fr-FR")} FCFA`} ·{" "}
                  {promo.appliesTo === "all" ? "Tous les produits" : `${promo.products.length} produit(s)`}
                </div>
                {(promo.startDate || promo.endDate) && (
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {promo.startDate ? new Date(promo.startDate).toLocaleDateString("fr-FR") : "..."} → {promo.endDate ? new Date(promo.endDate).toLocaleDateString("fr-FR") : "..."}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Utilisé {promo.timesUsed} fois{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: promo.active ? "#e8f5ee" : "var(--cream)",
                  color: promo.active ? "var(--green-dark)" : "var(--ink-soft)",
                  whiteSpace: "nowrap",
                }}
              >
                {promo.active ? "Actif" : "Désactivé"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => toggleActive(promo._id)}
                disabled={busy === promo._id}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600 }}
              >
                {promo.active ? "Désactiver" : "Activer"}
              </button>
              <button
                onClick={() => remove(promo._id)}
                disabled={busy === promo._id}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", color: "var(--terracotta-dark)", background: "var(--white)", fontWeight: 600 }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </MerchantLayout>
  );
}
