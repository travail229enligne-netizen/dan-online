import { useEffect, useState } from "react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import CategoryGrid from "../components/CategoryGrid";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/shops").then((r) => setShops(r.data.slice(0, 4))).catch(() => {});
    api.get("/products?limit=8").then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  return (
    <>
      <Header cartCount={cartCount} />

      <main className="container" style={{ paddingBottom: 60 }}>
        <HeroBanner
          title="Le Marché de Dantokpa chez vous"
          subtitle="Toutes les allées du plus grand marché du Bénin, livrées chez vous en 48h."
        />

        <CategoryGrid categories={categories} />

        <section style={{ marginTop: 32 }}>
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
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gold)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {shop.location?.allee} {shop.location?.numero}
                  </div>
                  {shop.isVerified && (
                    <span style={{ fontSize: 11, color: "var(--green-deep)" }}>✔ Vérifié</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Produits Populaires</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {products.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={() => setCartCount((c) => c + 1)} />
            ))}
          </div>
        </section>
      </main>

      <nav
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--white)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 0",
        }}
      >
        {["Accueil", "Boutiques", "Catégories", "Commandes", "Compte"].map((label) => (
          <span key={label} style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {label}
          </span>
        ))}
      </nav>
    </>
  );
}
