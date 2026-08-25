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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get("/categories").then((r) => {
      const found = r.data.find((c) => c.slug === slug);
      setCategory(found || null);
      if (found) {
        api
          .get(`/products?category=${found._id}&limit=40`)
          .then((res) => setProducts(res.data.products))
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
              {products.length} produit{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
            </p>

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
          </>
        )}
      </main>
    </>
  );
}
