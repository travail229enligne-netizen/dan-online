import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusColors = {
  pending: "#e8a93b",
  confirmed: "#2c4a7a",
  out_for_delivery: "#c1592b",
  delivered: "#16543a",
  cancelled: "#8b2e3c",
};

export default function MerchantDashboard() {
  const [shop, setShop] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState(null);

  const loadData = () => {
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      api.get("/shops/me/stats").then((res) => setStats(res.data)).catch(() => {});
      api.get("/shops/me/chart").then((res) => setChart(res.data)).catch(() => {});
    }).catch(() => setShop(null));
  };

  useEffect(() => {
    loadData();
  }, []);

  const pieData = chart
    ? Object.entries(chart.statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ name: statusLabels[status], value: count, color: statusColors[status] }))
    : [];

  return (
    <MerchantLayout title="Tableau de bord">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
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
          Ta boutique est en attente de validation par l'équipe EasyShop. Tu pourras ajouter des produits une fois validée.
        </div>
      )}

      {shop && stats && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16, marginBottom: 28 }}>
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

      {shop && chart && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>Évolution — 30 derniers jours</h2>
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 28, boxSizing: "border-box" }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chart.evolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line yAxisId="left" type="monotone" dataKey="commandes" name="Commandes" stroke="#16543a" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="ventes" name="Ventes (FCFA)" stroke="#c1592b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>Top 5 produits vendus</h2>
              <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, boxSizing: "border-box" }}>
                {chart.topProducts.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Pas encore assez de ventes pour ce classement.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chart.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="quantite" name="Quantité vendue" fill="#16543a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>Répartition des commandes</h2>
              <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, boxSizing: "border-box" }}>
                {pieData.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune commande pour l'instant.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </MerchantLayout>
  );
}
