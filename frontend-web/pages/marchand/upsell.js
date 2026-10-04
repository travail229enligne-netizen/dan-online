import { useState, useEffect } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const box = { background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16 };
const ids = (p) => (p.upsellProducts || []).map((u) => (typeof u === "string" ? u : u._id));

export default function MerchantUpsell() {
  const [products, setProducts] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [selected, setSelected] = useState([]);
  const [hook, setHook] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/shops/me")
      .then((r) => api.get(`/products?shop=${r.data._id}&limit=1000`))
      .then((res) => setProducts(res.data.products))
      .catch(() => setMsg("Impossible de charger tes produits."));
  }, []);

  const pick = (id) => {
    setCurrentId(id);
    setMsg("");
    const p = products.find((x) => x._id === id);
    setSelected(p ? ids(p) : []);
    setHook(p?.upsellMessage || "");
  };

  const toggle = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else if (selected.length < 4) setSelected([...selected, id]);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.put(`/products/${currentId}`, { upsellProducts: selected, upsellMessage: hook });
      setProducts(products.map((p) => (p._id === currentId ? { ...p, upsellProducts: selected, upsellMessage: hook } : p)));
      setMsg("Enregistré ✅");
    } catch (e) {
      setMsg(e.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
    setSaving(false);
  };

  return (
    <MerchantLayout title="Ventes additionnelles">
      <div style={box}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          Choisis un produit, puis jusqu'à 4 autres produits à suggérer avec lui.
        </p>
        <select
          value={currentId}
          onChange={(e) => pick(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 14 }}
        >
          <option value="">-- Choisis un produit --</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {currentId && (
        <div style={box}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Suggérés avec ce produit ({selected.length}/4)
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {products.filter((p) => p._id !== currentId).map((p) => {
              const checked = selected.includes(p._id);
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => toggle(p._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    border: "1px solid var(--line)",
                    background: checked ? "var(--terracotta)" : "var(--white)",
                    color: checked ? "var(--white)" : "var(--ink)",
                  }}
                >
                  {p.name}
                </button>
              );
            })}
            {products.length < 2 && (
              <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Ajoute d'autres produits pour pouvoir les suggérer.</p>
            )}
          </div>
          <label style={{ display: "block", fontSize: 13, marginTop: 16 }}>
            Message d'accroche (affiché au client après sa commande)
            <input
              maxLength={80}
              placeholder="Ex: Complète ton repas avec nos boissons fraîches !"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, marginTop: 4, boxSizing: "border-box" }}
            />
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Laisse vide pour garder le message par défaut.</span>
          </label>
          <button className="btn-primary" onClick={save} disabled={saving} style={{ marginTop: 16 }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      )}
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
    </MerchantLayout>
  );
}
