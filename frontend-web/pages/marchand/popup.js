import { useState, useEffect } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const box = { background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16 };
const input = { width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, marginTop: 4 };

export default function MerchantPopup() {
  const [popup, setPopup] = useState({ enabled: false, title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/shops/me")
      .then((r) => setPopup(r.data.popup || { enabled: false, title: "", message: "" }))
      .catch(() => setMsg("Impossible de charger ta boutique."));
  }, []);

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
          Message affiché aux clients quand ils arrivent sur ta boutique.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={popup.enabled}
            onChange={(e) => setPopup({ ...popup, enabled: e.target.checked })}
          />
          Activer le pop-up promo
        </label>
        {popup.enabled && (
          <>
            <label style={{ display: "block", fontSize: 13, marginTop: 12 }}>
              Titre
              <input
                placeholder="Ex: Promo du jour !"
                value={popup.title}
                onChange={(e) => setPopup({ ...popup, title: e.target.value })}
                style={input}
              />
            </label>
            <label style={{ display: "block", fontSize: 13, marginTop: 12 }}>
              Message
              <textarea
                rows={3}
                placeholder="Ex: -10% sur toute la boutique aujourd'hui"
                value={popup.message}
                onChange={(e) => setPopup({ ...popup, message: e.target.value })}
                style={{ ...input, fontFamily: "inherit", resize: "vertical" }}
              />
            </label>
          </>
        )}
      </div>
      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
      {msg && <p style={{ fontSize: 13, marginTop: 12 }}>{msg}</p>}
    </MerchantLayout>
  );
}
