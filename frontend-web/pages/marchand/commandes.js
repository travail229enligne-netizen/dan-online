import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const nextStatus = {
  pending: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};

const nextLabel = {
  pending: "Confirmer",
  confirmed: "Marquer en livraison",
  out_for_delivery: "Marquer livrée",
};

export default function MarchandCommandes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    api
      .get("/orders/shop")
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const advance = async (order) => {
    const status = nextStatus[order.status];
    if (!status) return;
    setUpdating(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status });
      load();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <MerchantLayout title="Commandes">
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Commandes reçues</h1>

      {loading && <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>}
      {!loading && orders.length === 0 && (
        <p style={{ color: "var(--ink-soft)" }}>Aucune commande pour l'instant.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.map((o) => (
          <div
            key={o._id}
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {new Date(o.createdAt).toLocaleDateString("fr-FR")} — {o.deliveryPhone}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)" }}>
                {statusLabels[o.status] || o.status}
              </span>
            </div>
            {o.items.map((it, i) => (
              <div key={i} style={{ fontSize: 13 }}>
                {it.quantity}× {it.name}
              </div>
            ))}
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{o.deliveryAddress}</div>
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--terracotta-dark)" }}>
              {o.grandTotal.toLocaleString("fr-FR")} FCFA
            </div>
            {nextStatus[o.status] && (
              <button
                className="btn-primary"
                style={{ marginTop: 10, fontSize: 12, padding: "8px 14px" }}
                onClick={() => advance(o)}
                disabled={updating === o._id}
              >
                {updating === o._id ? "..." : nextLabel[o.status]}
              </button>
            )}
          </div>
        ))}
      </div>
    </MerchantLayout>
  );
}
