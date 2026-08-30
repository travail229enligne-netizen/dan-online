import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function ReviewForm({ order, shopId, shopName, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/reviews", { orderId: order._id, shopId, rating, comment });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de l'avis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 10, padding: 10, background: "var(--cream)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Noter {shopName}</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            style={{ fontSize: 20, color: n <= rating ? "#f5a623" : "#ddd" }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Ton avis (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        style={{ width: "100%", padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, boxSizing: "border-box", fontFamily: "inherit" }}
      />
      {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      <button
        className="btn-primary"
        style={{ fontSize: 12, padding: "8px 14px", marginTop: 8 }}
        disabled={saving}
        onClick={submit}
      >
        {saving ? "Envoi..." : "Envoyer l'avis"}
      </button>
    </div>
  );
}

export default function Commandes() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState(undefined);
  const [openReview, setOpenReview] = useState(null);
  const [reviewedShops, setReviewedShops] = useState({});

  const load = () => {
    api.get("/orders/mine").then((r) => setOrders(r.data)).catch(() => setOrders([]));
  };

  useEffect(() => {
    if (!loading && user) load();
  }, [loading, user]);

  if (loading || (user && orders === undefined)) return null;

  if (!user) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Connecte-toi pour voir tes commandes.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Mes commandes</h1>

        {orders.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Tu n'as pas encore passé de commande.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((order) => {
              const shopIds = [...new Set(order.items.map((it) => it.shop))];
              const canPayNow = order.paymentMethod === "kkiapay" && order.paymentStatus !== "paid" && order.status === "out_for_delivery";

              return (
                <div
                  key={order._id}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 20,
                          background: "var(--cream)",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {order.paymentMethod === "kkiapay" ? "💳 Mobile Money" : "💵 Espèces"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: order.status === "delivered" ? "#e8f5ee" : "var(--cream)",
                          color: order.status === "delivered" ? "var(--green-dark)" : "var(--ink-soft)",
                        }}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  {order.items.map((it) => (
                    <div key={it.product} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                    <span>Total</span>
                    <span>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
                  </div>

                  {order.paymentMethod === "cod" && order.status !== "delivered" && order.status !== "cancelled" && (
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>
                      Prévois {order.grandTotal.toLocaleString("fr-FR")} FCFA en espèces pour le livreur.
                    </div>
                  )}

                  {order.paymentMethod === "kkiapay" && order.paymentStatus !== "paid" && !canPayNow && order.status !== "delivered" && order.status !== "cancelled" && (
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>
                      Tu pourras régler en ligne dès que ton livreur sera en route.
                    </div>
                  )}

                  {canPayNow && (
                    <a
                      href={`/payer-commande/${order._id}`}
                      className="btn-primary"
                      style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: 13, padding: "10px 16px" }}
                    >
                      💳 Payer en ligne maintenant
                    </a>
                  )}

                  {order.paymentMethod === "kkiapay" && order.paymentStatus === "paid" && (
                    <div style={{ fontSize: 11, color: "var(--green-dark)", fontWeight: 600, marginTop: 6 }}>
                      ✅ Payé le {order.paidAt ? new Date(order.paidAt).toLocaleDateString("fr-FR") : ""}
                    </div>
                  )}

                  {order.status === "delivered" && (
                    <div style={{ marginTop: 10 }}>
                      {shopIds.map((shopId) => {
                        const item = order.items.find((it) => it.shop === shopId);
                        const key = `${order._id}-${shopId}`;
                        const isOpen = openReview === key;
                        const isDone = reviewedShops[key];
                        return (
                          <div key={key}>
                            {!isDone && (
                              <button
                                onClick={() => setOpenReview(isOpen ? null : key)}
                                style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", textDecoration: "underline" }}
                              >
                                {isOpen ? "Annuler" : `Laisser un avis`}
                              </button>
                            )}
                            {isDone && <p style={{ fontSize: 12, color: "var(--green-dark)" }}>Merci pour ton avis !</p>}
                            {isOpen && !isDone && (
                              <ReviewForm
                                order={order}
                                shopId={shopId}
                                shopName={item?.name || "cette boutique"}
                                onDone={() => {
                                  setReviewedShops({ ...reviewedShops, [key]: true });
                                  setOpenReview(null);
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
