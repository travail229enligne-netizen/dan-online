import { useEffect, useState } from "react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useCart } from "../lib/cart";

const businessIcons = {
  restaurant: "🍽️",
  supermarche: "🛒",
  grossiste: "📦",
  artisan: "🛠️",
  boutique: "🏪",
};

export default function Home() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get("/shops").then((r) => setShops(r.data.slice(0, 4))).catch(() => {});
    api.get("/products?limit=8").then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  return (
    <>
      <Header hideSearchBar />

      <main className="container" style={{ paddingBottom: 60 }}>
        <HeroBanner
          title="Tout ce qui se vend, à portée de main"
          subtitle="Découvrez une nouvelle façon de faire vos achats et de vendre en ligne. Retrouvez les produits de commerçants, boutiques, grossistes et supermarchés sur une seule marketplace. Comparez, commandez et faites-vous livrer facilement, partout au Bénin et ailleurs."
        />

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <SearchBar size="large" />
        </div>

        <section id="boutiques" style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Boutiques Partenaires</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {shops.map((shop) => (
              <a
                key={shop._id}
                href={`/boutique/${shop.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--white)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: 12,
                }}
              >
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--ink)",
                      color: "var(--white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {shop.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {businessIcons[shop.businessType] || ""} {shop.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {shop.location?.allee} {shop.location?.numero}
                  </div>
                  {shop.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-soft)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {shop.description}
                    </div>
                  )}
                  {shop.isVerified && (
                    <span style={{ fontSize: 11, color: "var(--ink)" }}>✓ Vérifié</span>
                  )}
                </div>
              </a>
            ))}
            {shops.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune boutique pour l'instant.</p>
            )}
          </div>
        </section>

        <section style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Produits Populaires</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {products.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
            ))}
            {products.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun produit pour l'instant.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
