import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

export default function PayerCommande() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [order, setOrder] = useState(undefined);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => setOrder(null));
  }, [id]);

  const confirmPayment = async () => {
    setPaying(true);
    setError("");
    try {
      const { data } = await api.put(`/orders/${id}/pay`);
      setOrder(data);
      setPaid(true);
    } catch (err) {
      setError(err.response?.data?.message || "Paiement reçu mais impossible de le confirmer. Contacte le support.");
    } finally {
      setPaying(false);
    }
  };

  const handlePay = async () => {
    setError("");
    setPaying(true);
    try {
      const { data } = await api.post(`/orders/${id}/pay-init`);
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ouvrir le paiement. Réessaie.");
      setPaying(false);
    }
  };

  // Retour depuis la page de paiement FedaPay : le serveur verifie lui-meme la transaction
  useEffect(() => {
    if (!order || !router.isReady || confirmedRef.current) return;
    if (order.paymentStatus === "paid") return;
    if (router.query.retour) {
      confirmedRef.current = true;
      confirmPayment();
    }
  }, [order, router.isReady]);

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push(`/connexion?next=/payer-commande/${id}`);
    return null;
  }

  if (order === undefined) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Commande introuvable.</p>
        </main>
      </>
    );
  }

  if (!order.deliveryProofUrl) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Cette commande n'a pas encore été livrée. Tu pourras régler en ligne une fois la livraison confirmée.</p>
        </main>
      </>
    );
  }

  if (order.paymentStatus === "paid" || paid) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 30, paddingBottom: 60, maxWidth: 420 }}>
          <div style={{ background: "var(--white)", border: "2px solid var(--green-dark)", borderRadius: "var(--radius-md)", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h1 style={{ fontSize: 20, marginTop: 10 }}>Paiement confirmé</h1>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8 }}>Merci ! Ta commande est maintenant réglée.</p>
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 16, textAlign: "left", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Commande</span>
                <span>#{order._id.slice(-6).toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Montant payé</span>
                <span style={{ fontWeight: 700 }}>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date</span>
                <span>{order.paidAt ? new Date(order.paidAt).toLocaleString("fr-FR") : "-"}</span>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 30, paddingBottom: 60, maxWidth: 420 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Payer ta commande</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
          Ta commande a été livrée. Appuie sur le bouton pour payer par Mobile Money.
        </p>

        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 18, marginBottom: 20, boxSizing: "border-box" }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span>{it.quantity}× {it.name}</span>
              <span>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
            <span>Total à payer</span>
            <span style={{ color: "var(--terracotta-dark)" }}>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button className="btn-primary" onClick={handlePay} disabled={paying} style={{ width: "100%", fontSize: 15, padding: 14 }}>
          {paying ? "Vérification..." : "Payer maintenant"}
        </button>
      </main>
    </>
  );
}
