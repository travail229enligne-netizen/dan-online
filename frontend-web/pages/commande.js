import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
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
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    const handleSuccess = async (event) => {
      const transactionId = event.detail?.transactionId;
      if (!transactionId) return;
      setSubmitting(true);
      setError("");
      try {
        const { data } = await api.post("/orders", {
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
          deliveryAddress: form.deliveryAddress,
          deliveryPhone: form.deliveryPhone,
          transactionId,
        });
        setSuccess(data);
        clearCart();
      } catch (err) {
        setError(err.response?.data?.message || "Paiement reçu mais impossible de créer la commande. Contacte le support avec ta référence de transaction.");
      } finally {
        setSubmitting(false);
      }
    };

    const handleFailed = () => {
      setError("Le paiement a échoué ou a été annulé. Réessaie.");
      setSubmitting(false);
    };

    window.addEventListener("success", handleSuccess);
    window.addEventListener("failed", handleFailed);
    return () => {
      window.removeEventListener("success", handleSuccess);
      window.removeEventListener("failed", handleFailed);
    };
  }, [items, form]);

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push("/connexion?next=/commande");
    return null;
  }

  const handlePay = (e) => {
    e.preventDefault();
    setError("");
    if (!form.deliveryAddress || !form.deliveryPhone) {
      setError("Renseigne ton adresse et ton téléphone avant de payer.");
      return;
    }
    if (!widgetReady || typeof window.openKkiapayWidget !== "function") {
      setError("Le module de paiement n'est pas encore chargé, réessaie dans un instant.");
      return;
    }
    window.openKkiapayWidget({
      amount: total,
      key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY,
      sandbox: true,
      phone: form.deliveryPhone,
      data: JSON.stringify({ userId: user?._id }),
    });
  };

  if (success) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 22, marginTop: 12 }}>Commande confirmée et payée !</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            Montant payé : <strong>{success.grandTotal.toLocaleString("fr-FR")} FCFA</strong>
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
      <Script
        src="https://cdn.kkiapay.me/k.js"
        onLoad={() => setWidgetReady(true)}
      />
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
          onSubmit={handlePay}
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
            💳 Paiement en ligne sécurisé (Mobile Money) avant expédition. Les frais de livraison sont à régler séparément au livreur.
          </div>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Traitement..." : `Payer ${total.toLocaleString("fr-FR")} FCFA`}
          </button>
        </form>
      </main>
    </>
  );
}
