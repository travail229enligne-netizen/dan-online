import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export default function Recherche() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (router.query.q) setQuery(router.query.q);
  }, [router.query.q]);

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setSearched(true);
    const [prodRes, shopRes] = await Promise.all([
      api.get(`/products?search=${encodeURIComponent(q)}&limit=20`),
      api.get(`/shops?search=${encodeURIComponent(q)}`),
    ]);
    setProducts(prodRes.data.products);
    setShops(shopRes.data);
  };

  useEffect(() => {
    if (router.query.q) runSearch(router.query.q);
  }, [router.query.q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, une boutique..."
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 14,
            }}
          />
        </form>

        {!searched && (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Tape un mot-clé pour rechercher parmi les produits et boutiques d'EasyShop.
          </p>
        )}

        {searched && shops.length > 0 && (
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
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ink)" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      {shop.location?.allee} {shop.location?.numero}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {searched && (
          <section>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>
              Produits {products.length > 0 && `(${products.length})`}
            </h2>
            {products.length === 0 && shops.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                Aucun résultat pour "{query}".
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
