import { useEffect, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export default function ProduitsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q && q.trim()) params.set("search", q.trim());
    params.set("limit", "40");
    api
      .get(`/products?${params.toString()}`)
      .then((r) => setProducts(r.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load("");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    load(query);
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Tous les produits</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
          Retrouve tous les produits et plats disponibles sur EasyShop.
        </p>

        <form onSubmit={handleSubmit} style={{ position: "relative", marginBottom: 22 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit par nom..."
            style={{
              width: "100%",
              padding: "12px 46px 12px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            aria-label="Rechercher"
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              fontSize: 15,
            }}
          >
            🔍
          </button>
        </form>

        {loading && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {products.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
            ))}
            {products.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun produit trouvé.</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
