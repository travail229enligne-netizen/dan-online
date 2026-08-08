import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function Commande() {
  const { items, total, clearCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ deliveryAddress: user?.address || "", deliveryPhone: user?.phone || "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push("/connexion?next=/commande");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        deliveryAddress: form.deliveryAddress,
        deliveryPhone: form.deliveryPhone,
      });
      setSuccess(data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de valider la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 22, marginTop: 12 }}>Commande confirmée !</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            Total à régler à la livraison : <strong>{success.grandTotal.toLocaleString("fr-FR")} FCFA</strong>
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Livraison estimée sous 48h.</p>
          <a href="/commandes" className="btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
            Voir mes commandes
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: 480, paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Finaliser la commande</h1>

        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          {items.map((it) => (
            <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span>{it.quantity}× {it.name}</span>
              <span>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: "var(--terracotta-dark)" }}>{total.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <label style={{ fontSize: 12 }}>
            Adresse de livraison
            <input
              required
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Téléphone de contact
            <input
              required
              value={form.deliveryPhone}
              onChange={(e) => setForm({ ...form, deliveryPhone: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <div style={{ fontSize: 12, background: "var(--cream)", padding: 10, borderRadius: 8 }}>
            💰 Paiement à la livraison uniquement. Prépare le montant exact si possible.
          </div>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Validation..." : "Confirmer la commande"}
          </button>
        </form>
      </main>
    </>
  );
}
