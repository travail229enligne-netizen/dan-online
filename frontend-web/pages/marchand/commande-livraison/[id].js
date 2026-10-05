import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MerchantLayout from "../../../components/MerchantLayout";
import api from "../../../lib/api";

export default function CommandeLivraison() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(undefined);
  const [myCouriers, setMyCouriers] = useState([]);
  const [platformCouriers, setPlatformCouriers] = useState([]);
  const [useShopyz, setUseShopyz] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => setOrder(null));
    api.get("/shops/me/couriers").then((r) => setMyCouriers(r.data)).catch(() => setMyCouriers([]));
    api.get("/platform-couriers").then((r) => setPlatformCouriers(r.data)).catch(() => setPlatformCouriers([]));
  }, [id]);

  const couriers = useShopyz ? platformCouriers : myCouriers;

  const handleSend = async () => {
    if (useShopyz) {
      setSending(true);
      setError("");
      try {
        await api.post(`/shopyz-delivery/${order._id}/delegate`);
        setSent(true);
        setTimeout(() => router.push("/marchand/commandes"), 1200);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de confier cette commande à Shopyz.");
      } finally {
        setSending(false);
      }
      return;
    }
    if (useShopyz ? !selectedCourier : !courierPhone.trim()) {
      setError(useShopyz ? "Choisis un livreur avant d'envoyer." : "Saisis le numéro du livreur.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/messages/start-courier", {
        ...(useShopyz ? { courierId: selectedCourier } : { courierPhone: courierPhone.trim() }),
        orderId: order._id,
      });
      if (data.courierPhone) {
        const waNumber = `229${data.courierPhone.replace(/\D/g, "").replace(/^(00)?229(?=\d{8})/, "").replace(/^0/, "")}`;
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(data.whatsappText || "")}`;
        window.open(waUrl, "_blank");
      }

      setSent(true);
      setTimeout(() => router.push(`/messages/c/${data._id}`), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de contacter ce livreur.");
    } finally {
      setSending(false);
    }
  };

  if (order === undefined || myCouriers === undefined) {
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
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
        Bilan de la commande
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
        Indique le livreur qui va livrer cette commande.
      </p>

      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          marginBottom: 20,
          boxSizing: "border-box",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--cream)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            Articles
          </span>
        </div>
        <div style={{ padding: 18 }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span>{it.quantity}× {it.name}</span>
              <span style={{ fontWeight: 600 }}>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
            <span>Total</span>
            <span style={{ color: "var(--terracotta-dark)" }}>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--line)", background: "var(--cream)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            Livraison
          </span>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <div>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</div>
          <div>📞 {order.deliveryPhone}</div>
          <div style={{ fontWeight: 600, color: order.paymentMethod === "kkiapay" ? "var(--green-dark)" : "var(--terracotta-dark)" }}>
            {order.paymentMethod === "kkiapay"
              ? "💳 Déjà réglée en ligne"
              : `💵 À encaisser : ${order.grandTotal.toLocaleString("fr-FR")} FCFA`}
          </div>
        </div>
      </div>

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
        {useShopyz ? (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
            Ta commande sera transmise à l'administrateur Shopyz, qui déploiera ses livreurs.
          </p>
        ) : (
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Numéro du livreur
            <input
              type="tel"
              inputMode="tel"
              value={courierPhone}
              onChange={(e) => setCourierPhone(e.target.value)}
              placeholder="ex : 61 00 00 00"
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 14, fontSize: 15, boxSizing: "border-box" }}
            />
          </label>
        )}

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            Vous n'avez pas de livreurs disponibles ?
          </p>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={useShopyz}
              onChange={(e) => {
                setUseShopyz(e.target.checked);
                setSelectedCourier("");
              }}
            />
            Confier la livraison à Shopyz
          </label>
        </div>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14, margin: 0 }}>{error}</p>}
        {sent && <p style={{ color: "var(--green-dark)", fontSize: 14, margin: 0 }}>{useShopyz ? "Commande confiée à Shopyz ! Redirection..." : "Livreur contacté ! Redirection..."}</p>}

        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={sending || sent}
          style={{ fontSize: 15, padding: 14 }}
        >
          {sending ? "Envoi..." : useShopyz ? "Confier à Shopyz" : "Contacter le livreur"}
        </button>
      </div>
    </MerchantLayout>
  );
}
