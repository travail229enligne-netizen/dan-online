import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MerchantLayout from "../../components/MerchantLayout";
import ImageUpload from "../../components/ImageUpload";
import api from "../../lib/api";

const themeOptions = [
  { name: "Terracotta", value: "#c1592b" },
  { name: "Vert marché", value: "#16543a" },
  { name: "Or", value: "#e8a93b" },
  { name: "Bordeaux", value: "#8b2e3c" },
  { name: "Bleu indigo", value: "#2c4a7a" },
  { name: "Violet", value: "#6b3fa0" },
];

const cities = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon"];

const businessTypes = [
  { value: "boutique", label: "Boutique", icon: "🏪" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "supermarche", label: "Supermarché", icon: "🛒" },
  { value: "grossiste", label: "Grossiste", icon: "📦" },
  { value: "artisan", label: "Artisan", icon: "🛠️" },
];

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 15,
  boxSizing: "border-box",
};

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--ink-soft)",
        marginBottom: 14,
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
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default function Boutique() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [existingShop, setExistingShop] = useState(undefined);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    businessType: "boutique",
    city: "",
    allee: "",
    numero: "",
    themeColor: "#c1592b",
    logoUrl: "",
    deliveryZones: [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api
      .get("/shops/me")
      .then((r) => {
        setExistingShop(r.data);
        if (r.data) {
          setForm({
            name: r.data.name || "",
            description: r.data.description || "",
            category: r.data.category?._id || "",
            businessType: r.data.businessType || "boutique",
            city: r.data.city || "",
            allee: r.data.location?.allee || "",
            numero: r.data.location?.numero || "",
            themeColor: r.data.themeColor || "#c1592b",
            logoUrl: r.data.logoUrl || "",
            deliveryZones: r.data.deliveryZones || [],
          });
        }
      })
      .catch(() => setExistingShop(null));
  }, []);

  const addZone = () => {
    setForm({ ...form, deliveryZones: [...form.deliveryZones, { city: "", price: "" }] });
  };

  const updateZone = (index, field, value) => {
    const zones = [...form.deliveryZones];
    zones[index] = { ...zones[index], [field]: value };
    setForm({ ...form, deliveryZones: zones });
  };

  const removeZone = (index) => {
    setForm({ ...form, deliveryZones: form.deliveryZones.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const cleanZones = form.deliveryZones
        .filter((z) => z.city && z.city.trim() && z.price !== "")
        .map((z) => ({ city: z.city.trim(), price: Number(z.price) }));

      const payload = { ...form, deliveryZones: cleanZones };

      let result;
      if (existingShop) {
        result = await api.put("/shops/me", payload);
      } else {
        result = await api.post("/shops", payload);
      }
      setExistingShop(result.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer la boutique.");
    } finally {
      setSaving(false);
    }
  };

  const toggleClose = async () => {
    if (existingShop.status === "active") {
      if (!window.confirm("Fermer votre boutique ? Elle ne sera plus visible publiquement, mais vous pourrez la rouvrir a tout moment.")) return;
    }
    setClosing(true);
    try {
      const endpoint = existingShop.status === "active" ? "/shops/me/close" : "/shops/me/reopen";
      const result = await api.put(endpoint, {});
      setExistingShop(result.data);
    } catch (err) {
      setError(err.response?.data?.message || "Action impossible.");
    } finally {
      setClosing(false);
    }
  };

  return (
    <MerchantLayout title="Ma boutique">
      <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
          {existingShop ? "Paramètres de ma boutique" : "Créer ma boutique"}
        </h1>

        {existingShop && existingShop.status === "active" && (
          <a
            href={`/boutique/${existingShop.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginBottom: 10,
              fontSize: 13,
              color: "var(--terracotta-dark)",
              fontWeight: 600,
            }}
          >
            Voir ma boutique en ligne
          </a>
        )}

        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
          {existingShop
            ? existingShop.status === "pending"
              ? "En attente de validation par l'équipe EasyShop."
              : existingShop.status === "closed"
              ? "Ta boutique est fermée et n'apparaît plus publiquement."
              : "Boutique active sur le marché."
            : "Renseigne les informations de ton emplacement virtuel."}
        </p>

        {existingShop && existingShop.status !== "pending" && (
          <button
            onClick={toggleClose}
            disabled={closing}
            style={{
              marginBottom: 20,
              fontSize: 14,
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "var(--white)",
              color: existingShop.status === "active" ? "var(--terracotta-dark)" : "var(--green-dark)",
              fontWeight: 600,
            }}
          >
            {existingShop.status === "active" ? "Fermer ma boutique" : "Rouvrir ma boutique"}
          </button>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Section>
            <Eyebrow>Type de commerce</Eyebrow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {businessTypes.map((bt) => (
                <button
                  type="button"
                  key={bt.value}
                  onClick={() => setForm({ ...form, businessType: bt.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `2px solid ${form.businessType === bt.value ? "var(--terracotta)" : "var(--line)"}`,
                    background: form.businessType === bt.value ? "var(--terracotta)" : "var(--white)",
                    color: form.businessType === bt.value ? "var(--white)" : "var(--ink)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {bt.icon} {bt.label}
                </button>
              ))}
            </div>
          </Section>

          <Section>
            <Eyebrow>Identité de la boutique</Eyebrow>

            <ImageUpload
              label="Logo de la boutique"
              value={form.logoUrl}
              onChange={(url) => setForm({ ...form, logoUrl: url })}
            />

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nom de la boutique
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Catégorie principale
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
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

          <Section>
            <Eyebrow>Localisation</Eyebrow>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Ville
              <input
                required
                list="villes-suggestions"
                placeholder="ex: Cotonou"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={inputStyle}
              />
              <datalist id="villes-suggestions">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, fontWeight: 600, flex: "1 1 120px", minWidth: 0 }}>
                Allée
                <input
                  placeholder="Allée 3"
                  value={form.allee}
                  onChange={(e) => setForm({ ...form, allee: e.target.value })}
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 600, flex: "1 1 120px", minWidth: 0 }}>
                Numéro
                <input
                  placeholder="N°45"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  style={inputStyle}
                />
              </label>
            </div>
          </Section>

          <Section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Eyebrow>Tarifs de livraison par ville</Eyebrow>
              <button
                type="button"
                onClick={addZone}
                style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700, textDecoration: "underline", marginTop: -14 }}
              >
                + Ajouter
              </button>
            </div>
            {form.deliveryZones.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -8 }}>
                Aucune ville configurée. Sans tarif, la livraison sera à 0 FCFA pour toutes les villes.
              </p>
            )}
            {form.deliveryZones.map((zone, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  background: "var(--cream)",
                  borderRadius: 10,
                  padding: 10,
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                <input
                  list="villes-suggestions"
                  placeholder="Ville"
                  value={zone.city}
                  onChange={(e) => updateZone(i, "city", e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 10,
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    background: "var(--white)",
                  }}
                />
                <input
                  type="number"
                  placeholder="Prix"
                  value={zone.price}
                  onChange={(e) => updateZone(i, "price", e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 10,
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    background: "var(--white)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeZone(i)}
                  aria-label="Retirer cette ville"
                  style={{ fontSize: 18, color: "var(--terracotta-dark)", padding: "0 8px", fontWeight: 700, flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </Section>

          <Section>
            <Eyebrow>Apparence de la vitrine</Eyebrow>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {themeOptions.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setForm({ ...form, themeColor: t.value })}
                  title={t.name}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: t.value,
                    border: form.themeColor === t.value ? "3px solid var(--ink)" : "3px solid transparent",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </Section>

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14 }}>{error}</p>}
          {saved && <p style={{ color: "var(--green-dark)", fontSize: 14 }}>Boutique enregistrée !</p>}

          <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15, padding: 14 }}>
            {saving ? "Enregistrement..." : existingShop ? "Enregistrer les modifications" : "Créer ma boutique"}
          </button>
        </form>

        {!existingShop && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginTop: 12 }}>
            Ta boutique sera visible dès sa validation par l'équipe.
          </p>
        )}
      </div>
    </MerchantLayout>
  );
}
