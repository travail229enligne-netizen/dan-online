import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MerchantLayout from "../../../components/MerchantLayout";
import api from "../../../lib/api";

export default function CommandeLivraison() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(undefined);
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => setOrder(null));
    api.get("/shops/me/couriers").then((r) => setCouriers(r.data)).catch(() => setCouriers([]));
  }, [id]);

  const buildSummary = () => {
    if (!order) return "";
    const lines = order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ");
    return `Nouvelle livraison a effectuer :\n${lines}\nTotal : ${order.grandTotal.toLocaleString("fr-FR")} FCFA\nAdresse : ${order.deliveryAddress}\nVille : ${order.deliveryCity || "-"}\nTéléphone client : ${order.deliveryPhone}\nMode de paiement : ${order.paymentMethod === "kkiapay" ? "déjà payé en ligne" : "à encaisser en espèces à la livraison"}`;
  };

  const handleSend = async () => {
    if (!selectedCourier) {
      setError("Choisis un livreur avant d'envoyer.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/messages/start-courier", {
        courierId: selectedCourier,
        orderId: order._id,
        initialMessage: buildSummary(),
      });
      await api.put(`/orders/${order._id}/status`, { status: "out_for_delivery" });
      setSent(true);
      setTimeout(() => router.push(`/messages/c/${data._id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de contacter ce livreur.");
    } finally {
      setSending(false);
    }
  };

  if (order === undefined || couriers === undefined) {
    return (
      <MerchantLayout title="Bilan de la commande">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  if (!order) {
    return (
      <MerchantLayout title="Bilan de la commande">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Commande introuvable.</p>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Bilan de la commande">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 16 }}>
        Envoyer cette commande à un livreur
      </h1>

      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          padding: 18,
          marginBottom: 20,
          boxSizing: "border-box",
        }}
      >
        {order.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
            <span>{it.quantity}× {it.name}</span>
            <span>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "var(--terracotta-dark)" }}>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
        </div>

        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
          <div>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</div>
          <div>📞 {order.deliveryPhone}</div>
          <div>
            {order.paymentMethod === "kkiapay"
              ? "💳 Déjà payé en ligne"
              : `💵 À encaisser : ${order.grandTotal.toLocaleString("fr-FR")} FCFA en espèces`}
          </div>
        </div>
      </div>

      {couriers.length === 0 ? (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 14 }}>
            Tu n'as pas encore de livreur enregistré.
          </p>
          <a href="/marchand/livreurs" className="btn-primary" style={{ display: "inline-block" }}>
            Ajouter un livreur
          </a>
        </div>
      ) : (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxSizing: "border-box",
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Choisir un livreur
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }}
            >
              <option value="">Choisir...</option>
              {couriers.map((c) => (
                <option key={c.user} value={c.user}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </select>
          </label>

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14 }}>{error}</p>}
          {sent && <p style={{ color: "var(--green-dark)", fontSize: 14 }}>Livreur contacté ! Redirection...</p>}

          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={sending || sent}
            style={{ fontSize: 15, padding: 14 }}
          >
            {sending ? "Envoi..." : "Contacter le livreur"}
          </button>
        </div>
      )}
    </MerchantLayout>
  );
}
