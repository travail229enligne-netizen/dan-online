import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";

export default function Promotions() {
  const [promotions, setPromotions] = useState(undefined);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    api.get("/promotions").then((r) => setPromotions(r.data)).catch(() => setPromotions([]));
  }, []);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      // ignore
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>Promotions</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Codes de réduction actifs chez nos boutiques partenaires. Copie un code et utilise-le au moment de ta commande.
        </p>

        {promotions === undefined && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}
        {promotions && promotions.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune promotion active pour l'instant.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {promotions?.map((promo) => (
            <div
              key={promo._id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {promo.shop?.logoUrl ? (
                  <img src={promo.shop.logoUrl} alt={promo.shop.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {promo.shop?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <a href={`/boutique/${promo.shop?.slug}`} style={{ fontWeight: 700, fontSize: 14 }}>
                    {promo.shop?.name}
                  </a>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {promo.appliesTo === "all" ? "Sur tous les produits" : `Sur ${promo.products.length} produit(s)`}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--cream)", borderRadius: 10, padding: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "0.05em" }}>{promo.code}</div>
                  <div style={{ fontSize: 12, color: "var(--terracotta-dark)", fontWeight: 600 }}>
                    {promo.type === "percent" ? `-${promo.value}%` : `-${promo.value.toLocaleString("fr-FR")} FCFA`}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(promo.code)}
                  style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600 }}
                >
                  {copiedCode === promo.code ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
