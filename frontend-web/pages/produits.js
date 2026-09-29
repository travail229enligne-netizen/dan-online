import { useEffect, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useCart } from "../lib/cart";

const PAGE_SIZE = 40;

export default function ProduitsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = (q, pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (q && q.trim()) params.set("search", q.trim());
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(pageNum));

    api
      .get(`/products?${params.toString()}`)
      .then((r) => {
        setProducts((prev) => (append ? [...prev, ...r.data.products] : r.data.products));
        setTotalPages(r.data.pages || 1);
        setPage(pageNum);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    load("");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    load(query, 1, false);
  };

  const handleLoadMore = () => {
    load(query, page + 1, true);
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Tous les produits</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
          Retrouve tous les produits et plats disponibles sur Shopyz.
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
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              {products.map((p) => (
                <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
              ))}
              {products.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun produit trouvé.</p>
              )}
            </div>

            {page < totalPages && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--white)",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {loadingMore ? "Chargement..." : "Voir plus de produits"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
