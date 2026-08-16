import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [overview, setOverview] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () => {
    api.get("/admin/dashboard").then((r) => setOverview(r.data)).catch(() => {});
    api.get("/admin/shops/pending").then((r) => setPendingShops(r.data)).catch(() => {});
    api.get("/admin/shops").then((r) => setAllShops(r.data)).catch(() => {});
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/admin/withdrawals").then((r) => setWithdrawals(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!loading && user?.role === "admin") load();
  }, [loading, user]);

  const validate = async (shopId, approve) => {
    setBusy(shopId);
    try {
      await api.put(`/admin/shops/${shopId}/validate`, { approve, commissionRate: 10 });
      load();
    } finally {
      setBusy(null);
    }
  };

  const removeShop = async (shopId, shopName) => {
    if (!window.confirm(`Supprimer definitivement "${shopName}" ? Cette action est irreversible.`)) return;
    setBusy(shopId);
    try {
      await api.delete(`/admin/shops/${shopId}`);
      load();
    } finally {
      setBusy(null);
    }
  };

  const toggleProfessional = async (shopId, current) => {
    setBusy(shopId);
    try {
      await api.put(`/admin/shops/${shopId}/professional`, { isProfessional: !current });
      load();
    } finally {
      setBusy(null);
    }
  };

  const featureShop = async (shopId, isFeatured) => {
    const days = isFeatured ? 0 : prompt("Mettre en avant pendant combien de jours ?", "7");
    if (days === null) return;
    setBusy(shopId);
    try {
      await api.put(`/admin/shops/${shopId}/feature`, { days: Number(days) || 0 });
      load();
    } finally {
      setBusy(null);
    }
  };

  const updateCategoryCommission = async (categoryId, value) => {
    setBusy(categoryId);
    try {
      await api.put(`/categories/${categoryId}/commission`, { commissionRate: value });
      load();
    } finally {
      setBusy(null);
    }
  };

  const processWithdrawal = async (id, status) => {
    if (status === "paid" && !window.confirm("Confirmer que le paiement Mobile Money a bien été envoyé au marchand ?")) return;
    setBusy(id);
    try {
      await api.put(`/admin/withdrawals/${id}`, { status });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return null;

  if (!user || user.role !== "admin") {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Accès réservé aux administrateurs.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Espace administrateur</h1>

        {overview && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
            {[
              { label: "Marchands", value: overview.totalMarchands },
              { label: "Clients", value: overview.totalClients },
              { label: "Boutiques actives", value: overview.activeShops },
              { label: "En attente", value: overview.pendingShops },
              { label: "Commandes", value: overview.totalOrders },
              { label: "Commission totale", value: `${overview.totalCommission.toLocaleString("fr-FR")} FCFA` },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{c.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--green-dark)", marginTop: 2 }}>{c.value}</div>
              </div>
            ))}
          </section>
        )}

        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Retraits à traiter ({withdrawals.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {withdrawals.map((w) => (
            <div
              key={w._id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{w.amount.toLocaleString("fr-FR")} FCFA</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {w.shop?.name} - {w.shop?.owner?.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Mobile Money : {w.phone}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                  disabled={busy === w._id}
                  onClick={() => processWithdrawal(w._id, "paid")}
                >
                  Marquer payé
                </button>
                <button
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    color: "var(--terracotta-dark)",
                    fontWeight: 600,
                  }}
                  disabled={busy === w._id}
                  onClick={() => processWithdrawal(w._id, "rejected")}
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
          {withdrawals.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun retrait en attente.</p>
          )}
        </div>

        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Commissions par catégorie</h2>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", marginBottom: 32 }}>
          {categories.map((cat, i) => (
            <div
              key={cat._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: 12,
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  defaultValue={cat.commissionRate ?? ""}
                  placeholder="Défaut"
                  disabled={busy === cat._id}
                  onBlur={(e) => updateCategoryCommission(cat._id, e.target.value)}
                  style={{ width: 64, padding: 6, border: "1px solid var(--line)", borderRadius: 6, fontSize: 12, textAlign: "center" }}
                />
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>%</span>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p style={{ padding: 12, fontSize: 13, color: "var(--ink-soft)" }}>Aucune catégorie.</p>
          )}
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: -20, marginBottom: 32 }}>
          Laisse vide pour utiliser le taux par défaut de la plateforme. La commission d'une boutique spécifique est toujours prioritaire.
        </p>

        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Boutiques en attente de validation ({pendingShops.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {pendingShops.map((shop) => (
            <div
              key={shop._id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{shop.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {shop.owner?.name} - {shop.owner?.phone}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {shop.location?.allee} {shop.location?.numero}
              </div>
              <p style={{ fontSize: 13, marginTop: 6 }}>{shop.description}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                  disabled={busy === shop._id}
                  onClick={() => validate(shop._id, true)}
                >
                  Valider
                </button>
                <button
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    color: "var(--terracotta-dark)",
                    fontWeight: 600,
                  }}
                  disabled={busy === shop._id}
                  onClick={() => validate(shop._id, false)}
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
          {pendingShops.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune boutique en attente.</p>
          )}
        </div>

        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Toutes les boutiques ({allShops.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allShops.map((shop) => {
            const isFeatured = shop.featuredUntil && new Date(shop.featuredUntil) > new Date();
            return (
              <div
                key={shop._id}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      {shop.owner?.name} - statut : {shop.status}
                    </div>
                    {isFeatured && (
                      <div style={{ fontSize: 11, color: "var(--green-dark)", fontWeight: 600, marginTop: 2 }}>
                        Sponsorisée jusqu'au {new Date(shop.featuredUntil).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <button
                    style={{
                      fontSize: 12,
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      color: "var(--terracotta-dark)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                    disabled={busy === shop._id}
                    onClick={() => removeShop(shop._id, shop.name)}
                  >
                    Supprimer
                  </button>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={!!shop.isProfessional}
                      disabled={busy === shop._id}
                      onChange={() => toggleProfessional(shop._id, shop.isProfessional)}
                    />
                    Boutique professionnelle
                  </label>
                  <button
                    onClick={() => featureShop(shop._id, isFeatured)}
                    disabled={busy === shop._id}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isFeatured ? "var(--terracotta-dark)" : "var(--ink)",
                      textDecoration: "underline",
                    }}
                  >
                    {isFeatured ? "Retirer la mise en avant" : "Mettre en avant"}
                  </button>
                </div>
              </div>
            );
          })}
          {allShops.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune boutique.</p>
          )}
        </div>
      </main>
    </>
  );
}
