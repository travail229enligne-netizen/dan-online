import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

const cities = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon"];

export default function Commande() {
  const { items, total, clearCart } = useCart();
  const { user, loading, setSession, setPassword } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || "",
    deliveryAddress: user?.address || "",
    deliveryPhone: user?.phone || "",
    deliveryCity: "",
  });
  const [selfDelivery, setSelfDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shopFees, setShopFees] = useState([]);
  const [error, setError] = useState("");
  const [requireLogin, setRequireLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const [hasPromoCode, setHasPromoCode] = useState(false);
  const [promoInputs, setPromoInputs] = useState({});
  const [promoResults, setPromoResults] = useState({});
  const [promoChecking, setPromoChecking] = useState({});

  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const shopIds = [...new Set(items.map((it) => it.shopId).filter(Boolean))];

  const shopGroups = shopIds.map((id) => ({
    shopId: id,
    shopName: items.find((it) => it.shopId === id)?.shopName || "cette boutique",
  }));

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

  const handleVerifyPromo = async (shopId) => {
    const code = (promoInputs[shopId] || "").trim();
    if (!code) return;
    setPromoChecking((p) => ({ ...p, [shopId]: true }));
    try {
      const shopItemsIds = items.filter((it) => it.shopId === shopId).map((it) => it.productId);
      const { data } = await api.post("/promotions/validate", { shopId, code, productIds: shopItemsIds });

      const eligibleItems = items.filter((it) => shopId === it.shopId && data.eligibleProductIds.includes(it.productId));
      const eligibleSubtotal = eligibleItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const discount = data.type === "percent" ? (eligibleSubtotal * data.value) / 100 : Math.min(data.value, eligibleSubtotal);

      setPromoResults((p) => ({ ...p, [shopId]: { valid: true, discount, message: `Code appliqué : -${discount.toLocaleString("fr-FR")} FCFA` } }));
    } catch (err) {
      setPromoResults((p) => ({ ...p, [shopId]: { valid: false, discount: 0, message: err.response?.data?.message || "Code invalide." } }));
    } finally {
      setPromoChecking((p) => ({ ...p, [shopId]: false }));
    }
  };

  const totalDeliveryFee = selfDelivery ? 0 : shopFees.reduce((sum, s) => sum + s.fee, 0);
  const totalDiscount = Object.values(promoResults).reduce((sum, r) => sum + (r.valid ? r.discount : 0), 0);
  const grandTotal = Math.max(0, total - totalDiscount) + totalDeliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRequireLogin(false);

    if (!user && !form.name.trim()) {
      setError("Renseigne ton nom complet pour continuer.");
      return;
    }
    if (!form.deliveryAddress || !form.deliveryPhone) {
      setError("Renseigne ton adresse et ton téléphone avant de continuer.");
      return;
    }
    if (!selfDelivery && !form.deliveryCity.trim()) {
      setError("Renseigne ta ville pour calculer les frais de livraison, ou coche que tu gères ta propre livraison.");
      return;
    }

    const promoCodes = {};
    if (hasPromoCode) {
      for (const shopId of Object.keys(promoInputs)) {
        const code = (promoInputs[shopId] || "").trim();
        if (code) promoCodes[shopId] = code;
      }
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        name: form.name,
        deliveryAddress: form.deliveryAddress,
        deliveryPhone: form.deliveryPhone,
        deliveryCity: form.deliveryCity,
        selfDelivery,
        paymentMethod,
        promoCodes,
      });

      if (data.token) {
        setSession(data.token, data.user);
      }

      setSuccess(data);
      clearCart();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requireLogin) {
        setRequireLogin(true);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Impossible de créer la commande.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setPasswordSaving(true);
    try {
      await setPassword(newPassword);
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Impossible d'enregistrer le mot de passe.");
    } finally {
      setPasswordSaving(false);
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

          {!passwordSaved && success.user && !success.user.hasPassword && (
            <div style={{ maxWidth: 360, margin: "24px auto 0", background: "var(--cream)", borderRadius: 10, padding: 16, textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Crée un mot de passe pour suivre ta commande et être informé des nouveaux articles
              </p>
              <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="password"
                  placeholder="Mot de passe (min. 6 caractères)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
                />
                {passwordError && <p style={{ color: "var(--terracotta-dark)", fontSize: 12 }}>{passwordError}</p>}
                <button className="btn-primary" type="submit" disabled={passwordSaving}>
                  {passwordSaving ? "Enregistrement..." : "Créer mon mot de passe"}
                </button>
              </form>
              <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 8 }}>
                Note bien ce mot de passe, il te permettra de te reconnecter avec ton numéro de téléphone.
              </p>
            </div>
          )}

          {passwordSaved && (
            <p style={{ marginTop: 20, fontSize: 13, color: "var(--green-dark)" }}>
              Mot de passe enregistré. Tu peux te reconnecter avec ton téléphone à tout moment.
            </p>
          )}

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

          {totalDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--green-dark)", marginTop: 4 }}>
              <span>Réduction</span>
              <span>-{totalDiscount.toLocaleString("fr-FR")} FCFA</span>
            </div>
          )}

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
          {!user && (
            <label style={{ fontSize: 12 }}>
              Nom complet
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
              />
            </label>
          )}

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

          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={hasPromoCode}
              onChange={(e) => setHasPromoCode(e.target.checked)}
            />
            J'ai un code de réduction
          </label>

          {hasPromoCode && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--cream)", borderRadius: 10, padding: 12 }}>
              {shopGroups.map((sg) => {
                const result = promoResults[sg.shopId];
                return (
                  <div key={sg.shopId}>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Code pour {sg.shopName}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        placeholder="ex: PROMO10"
                        value={promoInputs[sg.shopId] || ""}
                        onChange={(e) => setPromoInputs((p) => ({ ...p, [sg.shopId]: e.target.value.toUpperCase() }))}
                        style={{ flex: 1, minWidth: 0, padding: 10, fontSize: 13, border: "1px solid var(--line)", borderRadius: 8, boxSizing: "border-box" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyPromo(sg.shopId)}
                        disabled={promoChecking[sg.shopId]}
                        style={{ fontSize: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        {promoChecking[sg.shopId] ? "..." : "Vérifier"}
                      </button>
                    </div>
                    {result && (
                      <p style={{ fontSize: 12, margin: "6px 0 0", color: result.valid ? "var(--green-dark)" : "var(--terracotta-dark)" }}>
                        {result.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div>
              <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>
              {requireLogin && (
                <a href={`/connexion?next=/commande`} className="btn-primary" style={{ display: "inline-block", marginTop: 8, fontSize: 13 }}>
                  Se connecter
                </a>
              )}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Traitement..." : "Confirmer la commande"}
          </button>
        </form>
      </main>
    </>
  );
}
