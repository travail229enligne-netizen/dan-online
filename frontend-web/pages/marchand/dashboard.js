import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

export default function MerchantDashboard() {
  const [shop, setShop] = useState(undefined);
  const [stats, setStats] = useState(null);

  const loadData = () => {
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      api.get("/shops/me/stats").then((res) => setStats(res.data)).catch(() => {});
    }).catch(() => setShop(null));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MerchantLayout title="Tableau de bord">
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>
        {shop ? `Bonjour, ${shop.name}` : "Tableau de bord"}
      </h1>

      {shop === null && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          <p style={{ marginBottom: 12, color: "var(--ink-soft)" }}>
            Tu n'as pas encore configuré ta boutique.
          </p>
          <a href="/marchand/boutique" className="btn-primary" style={{ display: "inline-block" }}>
            Configurer ma boutique
          </a>
        </div>
      )}

      {shop && shop.status === "pending" && (
        <div
          style={{
            background: "#FDF3E7",
            border: "1px solid var(--gold)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            fontSize: 13,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          Ta boutique est en attente de validation par l'équipe Dan-Online. Tu pourras ajouter des produits une fois validée.
        </div>
      )}

      {shop && stats && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
          {[
            { label: "Commandes", value: stats.totalOrders ?? "–" },
            { label: "Ventes totales", value: stats.totalVentes ? `${stats.totalVentes.toLocaleString("fr-FR")} FCFA` : "–" },
            { label: "Commission plateforme", value: stats ? `${stats.totalCommission.toLocaleString("fr-FR")} FCFA` : "–" },
            { label: "Revenu net", value: stats ? `${stats.revenuNet.toLocaleString("fr-FR")} FCFA` : "–" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--green-dark)" }}>
                {card.value}
              </div>
            </div>
          ))}
        </section>
      )}
    </MerchantLayout>
  );
}
