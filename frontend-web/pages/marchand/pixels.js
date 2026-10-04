import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid var(--line)",
  borderRadius: 14,
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

function Section({ children }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export default function MarchandPixels() {
  const [form, setForm] = useState({ metaPixelId: "", tiktokPixelId: "", googleAdsId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/shops/me")
      .then((r) => {
        if (r.data && r.data.pixels) setForm(r.data.pixels);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put("/shops/me", { pixels: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Pixels publicitaires">
        <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Pixels publicitaires">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
        Pixels publicitaires
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
        Branche tes propres pixels pour suivre et cibler les visiteurs de ta boutique sur Facebook, Instagram, TikTok et Google Ads. Shopyz déclenche automatiquement les événements (vue de produit, ajout au panier, commande) pour toi.
      </p>

      <form onSubmit={handleSave}>
        <Section>
          <label style={labelStyle}>
            Meta Pixel ID (Facebook / Instagram)
            <input
              placeholder="Ex: 1234567890123456"
              value={form.metaPixelId}
              onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })}
              style={inputStyle}
            />
          </label>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Trouvable dans Meta Events Manager → ton pixel → Paramètres.
          </p>
        </Section>

        <Section>
          <label style={labelStyle}>
            TikTok Pixel ID
            <input
              placeholder="Ex: C4A1B2C3D4E5F6G7H8"
              value={form.tiktokPixelId}
              onChange={(e) => setForm({ ...form, tiktokPixelId: e.target.value })}
              style={inputStyle}
            />
          </label>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Trouvable dans TikTok Ads Manager → Bibliothèque d'évènements → ton pixel.
          </p>
        </Section>

        <Section>
          <label style={labelStyle}>
            Google Ads — ID de conversion (AW-XXXXXXXXX)
            <input
              placeholder="Ex: AW-123456789"
              value={form.googleAdsId}
              onChange={(e) => setForm({ ...form, googleAdsId: e.target.value })}
              style={inputStyle}
            />
          </label>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Trouvable dans Google Ads → Outils → Conversions.
          </p>
        </Section>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14 }}>{error}</p>}
        {saved && <p style={{ color: "var(--green-dark)", fontSize: 14 }}>Pixels enregistrés !</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15, padding: 14, borderRadius: 14 }}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </MerchantLayout>
  );
}
