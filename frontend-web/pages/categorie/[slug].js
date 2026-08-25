import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";

export default function CategoriePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();
  const [category, setCategory] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get("/categories").then((r) => {
      const found = r.data.find((c) => c.slug === slug);
      setCategory(found || null);
      if (found) {
        Promise.all([
          api.get(`/products?category=${found._id}&limit=40`),
          api.get(`/shops?category=${found._id}`),
        ])
          .then(([prodRes, shopRes]) => {
            setProducts(prodRes.data.products);
            setShops(shopRes.data);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [slug]);

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        {loading && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Chargement...</p>}

        {!loading && category === null && (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Catégorie introuvable.</p>
        )}

        {!loading && category && (
          <>
            <h1 style={{ fontSize: 20, marginBottom: 4 }}>
              {category.icon ? `${category.icon} ` : ""}{category.name}
            </h1>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              {shops.length} boutique{shops.length > 1 ? "s" : ""} · {products.length} produit{products.length > 1 ? "s" : ""}
            </p>

            {shops.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 16, marginBottom: 10 }}>Boutiques ({shops.length})</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                        <img src={shop.logoUrl} alt={shop.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ink)" }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                          {shop.city} {shop.location?.allee} {shop.location?.numero}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>
                Produits {products.length > 0 && `(${products.length})`}
              </h2>
              {products.length === 0 ? (
                <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                  Aucun produit dans cette catégorie pour l'instant.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
