import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const exampleCsv = `nom,prix,stock,unite,description
Riz local 25kg,15000,40,sac,Riz produit localement
Huile de palme 1L,1200,100,bouteille,
Sucre en poudre 1kg,800,200,kg,`;

export default function ImportCSV() {
  const [shop, setShop] = useState(undefined);
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/shops/me").then((r) => setShop(r.data)).catch(() => setShop(null));
  }, []);

  const handleImport = async () => {
    if (!text.trim()) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/products/import", { csv: text });
      setResult(res.data);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  if (shop === undefined) {
    return (
      <MerchantLayout title="Import en masse">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  if (shop?.businessType !== "supermarche") {
    return (
      <MerchantLayout title="Import en masse">
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Cette page est réservée aux boutiques de type "Supermarché". Tu peux changer le type
            de ta boutique dans ses paramètres si besoin.
          </p>
          <a href="/marchand/boutique" className="btn-primary" style={{ display: "inline-block", marginTop: 14 }}>
            Paramètres de ma boutique
          </a>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Import en masse">
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Ajouter plusieurs produits d'un coup</h1>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
        Écris ou colle la liste de tes produits ci-dessous, un produit par ligne. Utilise le bouton
        "Voir un exemple" si tu ne sais pas comment t'y prendre.
      </p>

      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 14, marginBottom: 10, fontWeight: 700 }}>Comment écrire ta liste</h2>
        <ol style={{ fontSize: 13, color: "var(--ink-soft)", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>La première ligne doit être exactement : <code>nom,prix,stock,unite,description</code></li>
          <li>Chaque ligne suivante = un produit, avec les informations séparées par des virgules</li>
          <li>Le nom et le prix sont obligatoires. Stock, unité et description sont facultatifs (laisse vide si besoin)</li>
        </ol>
        <button
          type="button"
          onClick={() => setText(exampleCsv)}
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--terracotta-dark)",
            textDecoration: "underline",
          }}
        >
          Remplir avec un exemple
        </button>
      </div>

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
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          Ta liste de produits
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={exampleCsv}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
        </label>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

        <button
          className="btn-primary"
          onClick={handleImport}
          disabled={!text.trim() || importing}
        >
          {importing ? "Import en cours..." : "Ajouter ces produits"}
        </button>
      </div>

      {result && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginTop: 20,
          }}
        >
          <h2 style={{ fontSize: 14, marginBottom: 8, fontWeight: 700, color: "var(--green-dark)" }}>
            {result.message}
          </h2>
          {result.errors.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                {result.errors.length} ligne(s) ignorée(s) :
              </p>
              <ul style={{ fontSize: 11, color: "var(--terracotta-dark)", paddingLeft: 18 }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          )}
          <a href="/marchand/produits" style={{ fontSize: 12, fontWeight: 600, textDecoration: "underline", display: "inline-block", marginTop: 10 }}>
            Voir mes produits →
          </a>
        </div>
      )}
    </MerchantLayout>
  );
}
