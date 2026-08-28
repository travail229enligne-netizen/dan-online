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
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (!widgetReady || typeof window.addKkiapayListener !== "function") return;

    const handleSuccess = async (response) => {
      const transactionId = response?.transactionId;
      if (!transactionId) return;
      setSubmitting(true);
      setError("");
      try {
        const { data } = await api.post("/orders", {
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
          deliveryAddress: form.deliveryAddress,
          deliveryPhone: form.deliveryPhone,
          transactionId,
          paymentMethod: "kkiapay",
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
    window.addKkiapayListener("success", handleSuccess);
    window.addKkiapayListener("failed", handleFailed);
    return () => {
      if (typeof window.removeKkiapayListener === "function") {
        window.removeKkiapayListener("success", handleSuccess);
        window.removeKkiapayListener("failed", handleFailed);
      }
    };
  }, [widgetReady, items, form]);

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push("/connexion?next=/commande");
    return null;
  }

  const handleCodOrder = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        deliveryAddress: form.deliveryAddress,
        deliveryPhone: form.deliveryPhone,
        paymentMethod: "cod",
      });
      setSuccess(data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.deliveryAddress || !form.deliveryPhone) {
      setError("Renseigne ton adresse et ton téléphone avant de continuer.");
      return;
    }

    if (paymentMethod === "cod") {
      handleCodOrder();
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
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 22, marginTop: 12 }}>Commande confirmée !</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            {success.paymentMethod === "kkiapay" ? "Montant payé" : "Montant à régler au livreur"} :{" "}
            <strong>{success.grandTotal.toLocaleString("fr-FR")} FCFA</strong>
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
      <Script src="https://cdn.kkiapay.me/k.js" onLoad={() => setWidgetReady(true)} />
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 480, paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Finaliser la commande</h1>

        {submitting && (
          <div style={{ background: "var(--cream)", padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            Traitement en cours...
          </div>
        )}

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

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Mode de paiement</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `2px solid ${paymentMethod === "cod" ? "var(--terracotta)" : "var(--line)"}`,
                  background: paymentMethod === "cod" ? "var(--terracotta)" : "var(--white)",
                  color: paymentMethod === "cod" ? "var(--white)" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                💵 À la livraison
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("kkiapay")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `2px solid ${paymentMethod === "kkiapay" ? "var(--terracotta)" : "var(--line)"}`,
                  background: paymentMethod === "kkiapay" ? "var(--terracotta)" : "var(--white)",
                  color: paymentMethod === "kkiapay" ? "var(--white)" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                💳 En ligne
              </button>
            </div>
          </div>

          {paymentMethod === "cod" ? (
            <div style={{ fontSize: 12, background: "var(--cream)", padding: 10, borderRadius: 8 }}>
              💵 Tu paieras en espèces directement au livreur à la réception de ta commande.
            </div>
          ) : (
            <div style={{ fontSize: 12, background: "var(--cream)", padding: 10, borderRadius: 8 }}>
              💳 Paiement en ligne sécurisé (Mobile Money) avant expédition. Les frais de livraison sont à régler séparément au livreur.
            </div>
          )}

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Traitement..." : paymentMethod === "cod" ? "Confirmer la commande" : "Payer maintenant"}
          </button>
        </form>
      </main>
    </>
  );
}
