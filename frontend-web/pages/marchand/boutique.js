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
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>
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

      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
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
            fontSize: 13,
            padding: "10px 16px",
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
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Type de commerce</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {businessTypes.map((bt) => (
              <button
                type="button"
                key={bt.value}
                onClick={() => setForm({ ...form, businessType: bt.value })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `2px solid ${form.businessType === bt.value ? "var(--terracotta)" : "var(--line)"}`,
                  background: form.businessType === bt.value ? "var(--terracotta)" : "var(--white)",
                  color: form.businessType === bt.value ? "var(--white)" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {bt.icon} {bt.label}
              </button>
            ))}
          </div>
        </div>

        <ImageUpload
          label="Logo de la boutique"
          value={form.logoUrl}
          onChange={(url) => setForm({ ...form, logoUrl: url })}
        />

        <label style={{ fontSize: 12 }}>
          Nom de la boutique
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

        <label style={{ fontSize: 12 }}>
          Catégorie principale
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

        <label style={{ fontSize: 12 }}>
          Ville
          <input
            required
            list="villes-suggestions"
            placeholder="ex: Cotonou"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
          />
          <datalist id="villes-suggestions">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ fontSize: 12, flex: 1 }}>
            Allée
            <input
              placeholder="Allée 3"
              value={form.allee}
              onChange={(e) => setForm({ ...form, allee: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12, flex: 1 }}>
            Numéro
            <input
              placeholder="N°45"
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Tarifs de livraison par ville</span>
            <button
              type="button"
              onClick={addZone}
              style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}
            >
              + Ajouter une ville
            </button>
          </div>
          {form.deliveryZones.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              Aucune ville configurée. Sans tarif, la livraison sera à 0 FCFA pour toutes les villes.
            </p>
          )}
          {form.deliveryZones.map((zone, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                list="villes-suggestions"
                placeholder="Ville"
                value={zone.city}
                onChange={(e) => updateZone(i, "city", e.target.value)}
                style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
              />
              <input
                type="number"
                placeholder="Prix (FCFA)"
                value={zone.price}
                onChange={(e) => updateZone(i, "price", e.target.value)}
                style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => removeZone(i)}
                aria-label="Retirer cette ville"
                style={{ fontSize: 16, color: "var(--terracotta-dark)", padding: "0 6px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Couleur de la vitrine</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {themeOptions.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setForm({ ...form, themeColor: t.value })}
                title={t.name}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: t.value,
                  border: form.themeColor === t.value ? "3px solid var(--ink)" : "3px solid transparent",
                }}
              />
            ))}
          </div>
        </div>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
        {saved && <p style={{ color: "var(--green-dark)", fontSize: 13 }}>Boutique enregistrée !</p>}

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : existingShop ? "Enregistrer les modifications" : "Créer ma boutique"}
        </button>
      </form>

      {!existingShop && (
        <p style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", marginTop: 10 }}>
          Ta boutique sera visible dès sa validation par l'équipe.
        </p>
      )}
    </MerchantLayout>
  );
}
