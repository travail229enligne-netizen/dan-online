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
  const [adApi, setAdApi] = useState({
    metaToken: "", metaTokenSet: false, metaTestCode: "", removeMetaToken: false,
    tiktokToken: "", tiktokTokenSet: false, tiktokTestCode: "", removeTiktokToken: false,
  });

  useEffect(() => {
    api
      .get("/shops/me")
      .then((r) => {
        if (r.data && r.data.pixels) setForm(r.data.pixels);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get("/shops/me/ad-api").then((r) => setAdApi((a) => ({ ...a, ...r.data }))).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put("/shops/me", { pixels: form });
      await api.put("/shops/me/ad-api", {
        metaToken: adApi.metaToken,
        metaTestCode: adApi.metaTestCode,
        removeMetaToken: adApi.removeMetaToken,
        tiktokToken: adApi.tiktokToken,
        tiktokTestCode: adApi.tiktokTestCode,
        removeTiktokToken: adApi.removeTiktokToken,
      });
      setAdApi((a) => ({
        ...a,
        metaTokenSet: a.metaToken.trim() ? true : a.removeMetaToken ? false : a.metaTokenSet,
        tiktokTokenSet: a.tiktokToken.trim() ? true : a.removeTiktokToken ? false : a.tiktokTokenSet,
        metaToken: "",
        tiktokToken: "",
        removeMetaToken: false,
        removeTiktokToken: false,
      }));
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

        <Section>
          <p style={{ fontSize: 14, fontWeight: 700 }}>API de conversion (serveur)</p>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Envoie aussi tes achats directement depuis Shopyz, même quand le navigateur du client bloque le pixel. Les jetons restent sur le serveur et ne sont jamais affichés.
          </p>
          <label style={labelStyle}>
            Jeton d'accès Meta
            <input
              type="password"
              autoComplete="off"
              placeholder={adApi.metaTokenSet ? "Jeton enregistré ✅ (laisse vide pour le garder)" : "Colle ton jeton ici"}
              value={adApi.metaToken}
              onChange={(e) => setAdApi({ ...adApi, metaToken: e.target.value })}
              style={inputStyle}
            />
          </label>
          {adApi.metaTokenSet && (
            <button type="button" className="btn-secondary" onClick={() => setAdApi({ ...adApi, metaTokenSet: false, removeMetaToken: true, metaToken: "" })}>
              Supprimer le jeton Meta
            </button>
          )}
          <label style={labelStyle}>
            Code d'événement de test Meta (optionnel)
            <input placeholder="Ex: TEST12345" value={adApi.metaTestCode} onChange={(e) => setAdApi({ ...adApi, metaTestCode: e.target.value })} style={inputStyle} />
          </label>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Meta Events Manager → ton pixel → Paramètres → API de conversion → Générer un jeton d'accès. Le code de test est dans l'onglet « Événements de test ». Vide-le une fois les tests terminés.
          </p>
          <label style={labelStyle}>
            Jeton d'accès TikTok (Events API)
            <input
              type="password"
              autoComplete="off"
              placeholder={adApi.tiktokTokenSet ? "Jeton enregistré ✅ (laisse vide pour le garder)" : "Colle ton jeton ici"}
              value={adApi.tiktokToken}
              onChange={(e) => setAdApi({ ...adApi, tiktokToken: e.target.value })}
              style={inputStyle}
            />
          </label>
          {adApi.tiktokTokenSet && (
            <button type="button" className="btn-secondary" onClick={() => setAdApi({ ...adApi, tiktokTokenSet: false, removeTiktokToken: true, tiktokToken: "" })}>
              Supprimer le jeton TikTok
            </button>
          )}
          <label style={labelStyle}>
            Code d'événement de test TikTok (optionnel)
            <input placeholder="Ex: TEST12345" value={adApi.tiktokTestCode} onChange={(e) => setAdApi({ ...adApi, tiktokTestCode: e.target.value })} style={inputStyle} />
          </label>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            TikTok Events Manager → ton pixel → Paramètres → Events API → Générer un jeton d'accès.
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
