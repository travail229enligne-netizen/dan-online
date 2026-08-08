import { useRouter } from "next/router";
import Header from "../components/Header";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";

export default function Panier() {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!user) {
      router.push("/connexion?next=/commande");
      return;
    }
    router.push("/commande");
  };

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Mon panier</h1>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-soft)" }}>
            <p>Ton panier est vide.</p>
            <a href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
              Retour au marché
            </a>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((it) => (
                <div
                  key={it.productId}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{it.shopName}</div>
                    <div style={{ fontWeight: 700, color: "var(--terracotta-dark)", marginTop: 4 }}>
                      {(it.price * it.quantity).toLocaleString("fr-FR")} FCFA
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, background: "var(--line)" }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: "center" }}>{it.quantity}</span>
                    <button
                      onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, background: "var(--line)" }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(it.productId)}
                      style={{ marginLeft: 6, fontSize: 12, color: "var(--terracotta-dark)" }}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: "var(--terracotta-dark)" }}>{total.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                Paiement à la livraison — livraison estimée sous 48h.
              </p>
              <button className="btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={handleCheckout}>
                Passer la commande
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
