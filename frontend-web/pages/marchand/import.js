import { useEffect, useRef, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

export default function ImportCSV() {
  const [shop, setShop] = useState(undefined);
  const [fileName, setFileName] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get("/shops/me").then((r) => setShop(r.data)).catch(() => setShop(null));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setCsvContent(ev.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/products/import", { csv: csvContent });
      setResult(res.data);
      setFileName("");
      setCsvContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            L'import en masse par CSV est réservé aux boutiques de type "Supermarché". Tu peux changer le type
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
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Import de produits par CSV</h1>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
        Idéal pour ajouter rapidement un grand catalogue. Maximum 500 produits par fichier.
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
        <h2 style={{ fontSize: 14, marginBottom: 10, fontWeight: 700 }}>Format attendu</h2>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
          Un fichier .csv avec une ligne d'en-tête, colonnes séparées par des virgules :
        </p>
        <pre
          style={{
            background: "var(--cream)",
            borderRadius: 8,
            padding: 10,
            fontSize: 11,
            overflowX: "auto",
            marginBottom: 8,
          }}
        >
{`nom,prix,stock,unite,description
Riz local 25kg,15000,40,sac,Riz produit localement
Huile de palme 1L,1200,100,bouteille,`}
        </pre>
        <p style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          Colonnes obligatoires : <strong>nom</strong>, <strong>prix</strong>. Les colonnes stock, unite et
          description sont optionnelles.
        </p>
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={{ fontSize: 13 }}
        />
        {fileName && (
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Fichier sélectionné : {fileName}</p>
        )}

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

        <button
          className="btn-primary"
          onClick={handleImport}
          disabled={!csvContent || importing}
        >
          {importing ? "Import en cours..." : "Importer les produits"}
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
