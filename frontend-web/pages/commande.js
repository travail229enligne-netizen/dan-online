import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

const cities = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon"];

export default function Commande() {
  const { items, total, clearCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    deliveryAddress: user?.address || "",
    deliveryPhone: user?.phone || "",
    deliveryCity: "",
  });
  const [selfDelivery, setSelfDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shopFees, setShopFees] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const shopIds = [...new Set(items.map((it) => it.shopId).filter(Boolean))];

  useEffect(() => {
    if (selfDelivery || !form.deliveryCity.trim() || shopIds.length === 0) {
      setShopFees([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      shopIds.map((id) =>
        api
          .get(`/shops/by-id/${id}`)
          .then((r) => ({ shopId: id, shopName: r.data.name, fee: findZoneFee(r.data.deliveryZones, form.deliveryCity) }))
          .catch(() => ({ shopId: id, shopName: "", fee: 0 }))
      )
    ).then((results) => {
      if (!cancelled) setShopFees(results);
    });
    return () => {
      cancelled = true;
    };
  }, [form.deliveryCity, selfDelivery, items.length]);

  const findZoneFee = (zones, city) => {
    if (!Array.isArray(zones)) return 0;
    const zone = zones.find((z) => z.city.toLowerCase() === city.trim().toLowerCase());
    return zone ? zone.price : 0;
  };

  const totalDeliveryFee = selfDelivery ? 0 : shopFees.reduce((sum, s) => sum + s.fee, 0);
  const grandTotal = total + totalDeliveryFee;

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push("/connexion?next=/commande");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.deliveryAddress || !form.deliveryPhone) {
      setError("Renseigne ton adresse et ton téléphone avant de continuer.");
      return;
    }
    if (!selfDelivery && !form.deliveryCity.trim()) {
      setError("Renseigne ta ville pour calculer les frais de livraison, ou coche que tu gères ta propre livraison.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        deliveryAddress: form.deliveryAddress,
        deliveryPhone: form.deliveryPhone,
        deliveryCity: form.deliveryCity,
        selfDelivery,
        paymentMethod,
      });
      setSuccess(data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 22, marginTop: 12 }}>Commande confirmée !</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            Total : <strong>{success.grandTotal.toLocaleString("fr-FR")} FCFA</strong>
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            {success.paymentMethod === "kkiapay"
              ? "Tu pourras régler en ligne dès que ton livreur sera en route."
              : "Prévois le montant en espèces pour le livreur."}
          </p>
          <a href="/commandes" className="btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
            Voir mes commandes
          </a>
        </main>
      </>
    );
  }

  return (
    <>
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
            boxSizing: "border-box",
          }}
        >
          {items.map((it) => (
            <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span>{it.quantity}× {it.name}</span>
              <span>{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Sous-total produits</span>
            <span>{total.toLocaleString("fr-FR")} FCFA</span>
          </div>

          {!selfDelivery && shopFees.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {shopFees.map((s) => (
                <div key={s.shopId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)" }}>
                  <span>Livraison — {s.shopName}</span>
                  <span>{s.fee > 0 ? `${s.fee.toLocaleString("fr-FR")} FCFA` : "Non desservi"}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: "var(--terracotta-dark)" }}>{grandTotal.toLocaleString("fr-FR")} FCFA</span>
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
            boxSizing: "border-box",
          }}
        >
          <label style={{ fontSize: 12 }}>
            Adresse de livraison
            <input
              required
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Ville de livraison
            <input
              required={!selfDelivery}
              disabled={selfDelivery}
              list="villes-suggestions"
              placeholder="ex: Cotonou"
              value={form.deliveryCity}
              onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
            />
            <datalist id="villes-suggestions">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selfDelivery}
              onChange={(e) => setSelfDelivery(e.target.checked)}
            />
            Je m'occupe moi-même de la livraison (pas de frais de livraison)
          </label>

          <label style={{ fontSize: 12 }}>
            Téléphone de contact
            <input
              required
              value={form.deliveryPhone}
              onChange={(e) => setForm({ ...form, deliveryPhone: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
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
                💵 Espèces
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
                💳 Mobile Money
              </button>
            </div>
          </div>

          {paymentMethod === "cod" ? (
            <div style={{ fontSize: 12, background: "var(--cream)", padding: 10, borderRadius: 8 }}>
              💵 Tu paieras en espèces directement au livreur à la réception de ta commande.
            </div>
          ) : (
            <div style={{ fontSize: 12, background: "var(--cream)", padding: 10, borderRadius: 8 }}>
              💳 Tu pourras régler en ligne dès que ton livreur sera en route avec ta commande.
            </div>
          )}

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Traitement..." : "Confirmer la commande"}
          </button>
        </form>
      </main>
    </>
  );
}
