import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

const statusLabels = {
  pending: "En attente",
  paid: "Payé",
  rejected: "Refusé",
};

export default function PortefeuilleLivreur() {
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState(undefined);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get("/wallet/courier/me").then((r) => setWallet(r.data)).catch(() => setWallet(null));
  };

  useEffect(() => {
    if (!loading && user) load();
  }, [loading, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Montant invalide.");
      return;
    }
    if (amt > wallet.soldeDisponible) {
      setError("Montant supérieur à ton solde disponible.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/wallet/courier/withdraw", { amount: amt, phone });
      setSuccess(true);
      setAmount("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || wallet === undefined) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Connecte-toi pour voir ton portefeuille.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60, maxWidth: 480 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 20 }}>
          Mon portefeuille livreur
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Disponible</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green-dark)", marginTop: 2 }}>
              {wallet.soldeDisponible.toLocaleString("fr-FR")} FCFA
            </div>
          </div>
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>En attente</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", marginTop: 2 }}>
              {wallet.soldeEnAttente.toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 20 }}>
          Tu gagnes le frais de livraison de chaque course terminée. Total gagné à ce jour :{" "}
          <strong>{wallet.totalGagne.toLocaleString("fr-FR")} FCFA</strong>.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 24,
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Demander un retrait</h2>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Montant (FCFA)
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }}
            />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Numéro Mobile Money
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }}
            />
          </label>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          {success && <p style={{ color: "var(--green-dark)", fontSize: 13 }}>Demande envoyée !</p>}
          <button className="btn-primary" type="submit" disabled={submitting || wallet.soldeDisponible <= 0} style={{ fontSize: 15, padding: 14 }}>
            {submitting ? "Envoi..." : "Demander le retrait"}
          </button>
        </form>

        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historique</h2>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
          {wallet.withdrawals.map((w, i) => (
            <div key={w._id} style={{ display: "flex", justifyContent: "space-between", padding: 14, borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.amount.toLocaleString("fr-FR")} FCFA</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{new Date(w.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  alignSelf: "center",
                  color: w.status === "paid" ? "var(--green-dark)" : w.status === "rejected" ? "var(--terracotta-dark)" : "var(--ink-soft)",
                }}
              >
                {statusLabels[w.status]}
              </span>
            </div>
          ))}
          {wallet.withdrawals.length === 0 && (
            <p style={{ padding: 14, fontSize: 13, color: "var(--ink-soft)" }}>Aucun retrait pour l'instant.</p>
          )}
        </div>
      </main>
    </>
  );
}
