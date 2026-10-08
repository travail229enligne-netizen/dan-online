import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import MerchantLayout from "../../components/MerchantLayout";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

const durations = [3, 7, 15, 30];

export default function Booster() {
  const { user } = useAuth();
  const router = useRouter();
  const retourRef = useRef(false);
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [target, setTarget] = useState("shop");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [days, setDays] = useState(7);
  const [price, setPrice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get("/shops/me").then((r) => {
      setShop(r.data);
      if (r.data) {
        api.get(`/products?shop=${r.data._id}&limit=100`).then((res) => setProducts(res.data.products));
      }
    }).catch(() => setShop(null));
  }, []);

  useEffect(() => {
    api.get(`/feature/price?target=${target}&days=${days}`).then((r) => setPrice(r.data)).catch(() => setPrice(null));
  }, [target, days]);

  useEffect(() => {
    if (!router.isReady || !router.query.retour || retourRef.current) return;
    retourRef.current = true;
    setPaying(true);
    setError("");
    api
      .post("/feature/confirm")
      .then((r) => {
        if (r.data.applied > 0) {
          setDone(r.data.last);
          setSuccess(true);
        } else {
          setError("Paiement non confirmé. Si tu as été débité, patiente une minute puis recharge cette page.");
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Impossible de confirmer le paiement. Contacte le support."))
      .finally(() => setPaying(false));
  }, [router.isReady]);

  const handlePay = async () => {
    setError("");
    if (target === "product" && !selectedProduct) {
      setError("Choisis un produit à mettre en avant.");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post("/feature/init", { target, days, productId: selectedProduct });
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ouvrir le paiement. Réessaie.");
      setPaying(false);
    }
  };

  if (shop === undefined) {
    return (
      <MerchantLayout title="Booster ma visibilité">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  if (shop === null || shop.status !== "active") {
    return (
      <MerchantLayout title="Booster ma visibilité">
        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 18, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
            Ta boutique doit être active et validée pour pouvoir être mise en avant.
          </p>
        </div>
      </MerchantLayout>
    );
  }

  if (success) {
    return (
      <MerchantLayout title="Booster ma visibilité">
        <div style={{ background: "var(--white)", border: "2px solid var(--green-dark)", borderRadius: "var(--radius-md)", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 20, marginTop: 10 }}>Mise en avant activée !</h1>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8 }}>
            {done?.target === "product" ? "Ton produit" : "Ta boutique"} est maintenant mis en avant pour {done?.days} jours.
          </p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <>
      <MerchantLayout title="Booster ma visibilité">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>Booster ma visibilité</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
          Fais apparaître ta boutique ou un produit en priorité sur Shopyz.
        </p>

        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 18, display: "flex", flexDirection: "column", gap: 16, boxSizing: "border-box" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Que veux-tu mettre en avant ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setTarget("shop")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `2px solid ${target === "shop" ? "var(--terracotta)" : "var(--line)"}`,
                  background: target === "shop" ? "var(--terracotta)" : "var(--white)",
                  color: target === "shop" ? "var(--white)" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                🏪 Ma boutique
              </button>
              <button
                type="button"
                onClick={() => setTarget("product")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `2px solid ${target === "product" ? "var(--terracotta)" : "var(--line)"}`,
                  background: target === "product" ? "var(--terracotta)" : "var(--white)",
                  color: target === "product" ? "var(--white)" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                📦 Un produit
              </button>
            </div>
          </div>

          {target === "product" && (
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Choisir le produit
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 6, border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }}
              >
                <option value="">Choisir...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Durée</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {durations.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDays(d)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: `2px solid ${days === d ? "var(--terracotta)" : "var(--line)"}`,
                    background: days === d ? "var(--terracotta)" : "var(--white)",
                    color: days === d ? "var(--white)" : "var(--ink)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {d} jours
                </button>
              ))}
            </div>
          </div>

          {price && (
            <div style={{ background: "var(--cream)", borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{price.pricePerDay.toLocaleString("fr-FR")} FCFA × {price.days} jours</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--terracotta-dark)" }}>{price.total.toLocaleString("fr-FR")} FCFA</span>
            </div>
          )}

          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={handlePay} disabled={paying || !price} style={{ fontSize: 15, padding: 14 }}>
            {paying ? "Vérification..." : "Payer et activer"}
          </button>
        </div>
      </MerchantLayout>
    </>
  );
}
