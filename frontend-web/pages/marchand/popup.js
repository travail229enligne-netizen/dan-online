import { useState, useEffect } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";
import { BannerCard, POPUP_FONTS, POPUP_SIZES } from "../../components/PromoBanner";

const DEFAULT = { enabled: false, title: "", message: "", font: "moderne", size: "moyenne", image: "" };
const box = { background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16 };
const input = { width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, marginTop: 4, boxSizing: "border-box" };
const chip = (on) => ({
  padding: "8px 12px",
  borderRadius: 20,
  fontSize: 13,
  border: "1px solid var(--line)",
  background: on ? "var(--terracotta)" : "var(--white)",
  color: on ? "var(--white)" : "var(--ink)",
});

const toSmallDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, 240 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function MerchantPopup() {
  const [popup, setPopup] = useState(DEFAULT);
  const [themeColor, setThemeColor] = useState("#111111");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/shops/me")
      .then((r) => {
        setPopup({ ...DEFAULT, ...(r.data.popup || {}) });
        setThemeColor(r.data.themeColor || "#111111");
      })
      .catch(() => setMsg("Impossible de charger ta boutique."));
  }, []);

  const set = (patch) => setPopup((p) => ({ ...p, ...patch }));

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set({ image: await toSmallDataUrl(file) });
      setMsg("");
    } catch {
      setMsg("Image illisible, essaie un autre fichier.");
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.put("/shops/me", { popup });
      setMsg("Enregistré ✅");
    } catch (e) {
      setMsg(e.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
    setSaving(false);
  };

  return (
    <MerchantLayout title="Pop-up d'accueil">
      <div style={box}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          Bannière animée en bas de ta boutique et de tes produits : 8 s à l'arrivée, puis 5 s toutes les 30 s.
          Elle ne bloque jamais le client.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
          <input type="checkbox" checked={popup.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          Activer la bannière
        </label>
      </div>

      {popup.enabled && (
        <>
          <div style={box}>
            <label style={{ display: "block", fontSize: 13 }}>
              Titre (4 à 6 mots, ça se lit en 5 s)
              <input maxLength={40} placeholder="Ex: -10% aujourd'hui !" value={popup.title} onChange={(e) => set({ title: e.target.value })} style={input} />
            </label>
            <label style={{ display: "block", fontSize: 13, marginTop: 12 }}>
              Message (une ligne)
              <input maxLength={90} placeholder="Ex: Sur toute la boutique jusqu'à ce soir" value={popup.message} onChange={(e) => set({ message: e.target.value })} style={input} />
            </label>
          </div>

          <div style={box}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Police</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(POPUP_FONTS).map(([k, f]) => (
                <button key={k} type="button" onClick={() => set({ font: k })} style={{ ...chip(popup.font === k), fontFamily: f.family }}>
                  {f.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>Taille</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(POPUP_SIZES).map(([k, s]) => (
                <button key={k} type="button" onClick={() => set({ size: k })} style={chip(popup.size === k)}>
                  {s.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>Image (un produit ou un logo)</p>
            <input type="file" accept="image/*" onChange={onImage} />
            {popup.image && (
              <button type="button" onClick={() => set({ image: "" })} style={{ ...chip(false), marginTop: 8 }}>
                Retirer l'image
              </button>
            )}
          </div>

          <div style={box}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Aperçu</p>
            <BannerCard popup={popup} themeColor={themeColor} animate={false} />
          </div>
        </>
      )}

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
      {msg && <p style={{ fontSize: 13, marginTop: 12 }}>{msg}</p>}
    </MerchantLayout>
  );
}
