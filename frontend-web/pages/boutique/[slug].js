import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";

function shade(hex, percent) {
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + percent));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    let b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return hex;
  }
}

export default function BoutiquePublique() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/shops/${slug}`)
      .then((r) => {
        setShop(r.data);
        return api.get(`/products?shop=${r.data._id}&limit=50`);
      })
      .then((r) => setProducts(r.data.products))
      .catch(() => setShop(null));
  }, [slug]);

  if (shop === undefined) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 60, textAlign: "center", color: "var(--ink-soft)" }}>
          Chargement de la boutique...
        </main>
      </>
    );
  }

  if (shop === null) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 60, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Cette boutique n'existe pas ou n'est plus disponible.</p>
          <a href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 14 }}>
            Retour au marché
          </a>
        </main>
      </>
    );
  }

  const theme = shop.themeColor || "#111111";
  const themeDark = shade(theme, -30);
  const location = [shop.location?.allee, shop.location?.numero].filter(Boolean).join(", ");

  return (
    <>
      <Header />

      <div
        style={{
          background: `linear-gradient(135deg, ${theme}, ${themeDark})`,
          padding: "20px 0",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h1 style={{ color: "var(--white)", fontSize: 20 }}>{shop.name}</h1>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          </div>

          {shop.description && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, maxWidth: 480, lineHeight: 1.5 }}>
              {shop.description}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {shop.isVerified && (
              <span
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "var(--white)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                Boutique vérifiée
              </span>
            )}
            {location && (
              <span
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "var(--white)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                {location}
              </span>
            )}
            {shop.category?.name && (
              <span
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "var(--white)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                {shop.category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="container" style={{ paddingTop: 22, paddingBottom: 60 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>
          Produits {products.length > 0 && `(${products.length})`}
        </h2>

        {products.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Cette boutique n'a pas encore de produits en ligne.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {products.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
