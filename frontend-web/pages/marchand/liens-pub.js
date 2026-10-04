import { useState, useEffect } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const box = { background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16 };

const PLATFORMS = [
  { id: "facebook", label: "Facebook / Instagram", source: "facebook", medium: "paid_social" },
  { id: "tiktok", label: "TikTok", source: "tiktok", medium: "paid_social" },
  { id: "google", label: "Google", source: "google", medium: "cpc" },
];

const slugify = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export default function MerchantAdLinks() {
  const [products, setProducts] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [campaign, setCampaign] = useState("");
  const [origin, setOrigin] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    api
      .get("/shops/me")
      .then((r) => api.get(`/products?shop=${r.data._id}&limit=1000`))
      .then((res) => setProducts(res.data.products))
      .catch(() => setMsg("Impossible de charger tes produits."));
  }, []);

  const product = products.find((p) => p._id === currentId);
  const plat = PLATFORMS.find((x) => x.id === platform);

  const pick = (id) => {
    setCurrentId(id);
    setCopied(false);
    const p = products.find((x) => x._id === id);
    setCampaign(slugify(p?.name));
  };

  const link = product
    ? `${origin}/produit/${product._id}?utm_source=${plat.source}&utm_medium=${plat.medium}&utm_campaign=${encodeURIComponent(slugify(campaign) || "campagne")}&utm_content=${product._id}`
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = link;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MerchantLayout>
      <h1 style={{ marginBottom: 6 }}>Liens publicitaires</h1>
      <p style={{ color: "var(--muted)", marginBottom: 16 }}>
        Choisis un produit, puis colle le lien généré comme destination de ta publicité.
      </p>
      {msg && <p style={{ marginBottom: 12 }}>{msg}</p>}

      <div style={box}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>1. Produit à promouvoir</label>
        <select
          value={currentId}
          onChange={(e) => pick(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }}
        >
          <option value="">Choisir un produit…</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} — {p.price} FCFA
            </option>
          ))}
        </select>
      </div>

      {product && (
        <>
          <div style={box}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>2. Plateforme</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLATFORMS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  className={platform === x.id ? "btn-primary" : "btn-secondary"}
                  onClick={() => setPlatform(x.id)}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          <div style={box}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>3. Nom de la campagne</label>
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="ex : promo-octobre"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }}
            />
          </div>

          <div style={box}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Ton lien</label>
            <div style={{ wordBreak: "break-all", fontSize: 13, background: "var(--bg, #f6f6f6)", padding: 10, borderRadius: 8, marginBottom: 10 }}>
              {link}
            </div>
            <button type="button" className="btn-primary" onClick={copy}>
              {copied ? "Copié ✅" : "Copier le lien"}
            </button>
          </div>
        </>
      )}
    </MerchantLayout>
  );
}
