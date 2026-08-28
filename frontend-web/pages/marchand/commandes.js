import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function MarchandCommandes() {
  const router = useRouter();
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

  const handleConfirm = async (order) => {
    setUpdating(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status: "confirmed" });
      load();
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkDelivered = async (order) => {
    setUpdating(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status: "delivered" });
      load();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <MerchantLayout title="Commandes">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 16 }}>Commandes reçues</h1>

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
              boxSizing: "border-box",
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

            {o.status === "pending" && (
              <button
                className="btn-primary"
                style={{ marginTop: 10, fontSize: 13, padding: "10px 16px" }}
                onClick={() => handleConfirm(o)}
                disabled={updating === o._id}
              >
                {updating === o._id ? "..." : "Confirmer"}
              </button>
            )}

            {o.status === "confirmed" && (
              <button
                className="btn-primary"
                style={{ marginTop: 10, fontSize: 13, padding: "10px 16px" }}
                onClick={() => router.push(`/marchand/commande-livraison/${o._id}`)}
              >
                Marquer en livraison
              </button>
            )}

            {o.status === "out_for_delivery" && (
              <button
                className="btn-primary"
                style={{ marginTop: 10, fontSize: 13, padding: "10px 16px" }}
                onClick={() => handleMarkDelivered(o)}
                disabled={updating === o._id}
              >
                {updating === o._id ? "..." : "Marquer livrée"}
              </button>
            )}
          </div>
        ))}
      </div>
    </MerchantLayout>
  );
}
