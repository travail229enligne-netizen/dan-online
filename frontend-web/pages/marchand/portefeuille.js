import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

export default function Portefeuille() {
  const [wallet, setWallet] = useState(undefined);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/wallet/me").then((r) => setWallet(r.data)).catch(() => setWallet(null));
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.post("/wallet/withdraw", { amount: Number(amount), phone });
      setAmount("");
      setPhone("");
      setSuccess("Demande de retrait envoyée. Elle sera traitée sous peu.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande de retrait.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = { pending: "En attente", paid: "Payé", rejected: "Refusé" };

  if (wallet === undefined) {
    return (
      <MerchantLayout title="Mon portefeuille">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  if (wallet === null) {
    return (
      <MerchantLayout title="Mon portefeuille">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Configure d'abord ta boutique pour accéder à ton portefeuille.
        </p>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Mon portefeuille">
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Mon portefeuille</h1>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Solde disponible</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green-dark)", marginTop: 2 }}>
            {wallet.soldeDisponible.toLocaleString("fr-FR")} FCFA
          </div>
        </div>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>En attente (livraison)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
            {wallet.soldeEnAttente.toLocaleString("fr-FR")} FCFA
          </div>
        </div>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Total gagné</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
            {wallet.totalGagne.toLocaleString("fr-FR")} FCFA
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Demander un retrait</h2>
        <form
          onSubmit={handleWithdraw}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <label style={{ fontSize: 12 }}>
            Montant (FCFA)
            <input
              required
              type="number"
              max={wallet.soldeDisponible}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Numéro Mobile Money
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+229..."
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          {success && <p style={{ color: "var(--green-dark)", fontSize: 13 }}>{success}</p>}
          <button className="btn-primary" disabled={saving || wallet.soldeDisponible <= 0}>
            {saving ? "Envoi..." : "Demander le retrait"}
          </button>
          {wallet.soldeDisponible <= 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              Aucun solde disponible pour le moment.
            </p>
          )}
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Historique des retraits</h2>
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
          {wallet.withdrawals.map((w, i) => (
            <div
              key={w._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 14,
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.amount.toLocaleString("fr-FR")} FCFA</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{w.phone}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: w.status === "paid" ? "var(--green-dark)" : w.status === "rejected" ? "var(--terracotta-dark)" : "var(--ink-soft)" }}>
                {statusLabel[w.status]}
              </div>
            </div>
          ))}
          {wallet.withdrawals.length === 0 && (
            <p style={{ padding: 14, fontSize: 13, color: "var(--ink-soft)" }}>Aucun retrait pour l'instant.</p>
          )}
        </div>
      </section>
    </MerchantLayout>
  );
}
