import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useCart } from "../lib/cart";

const cities = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon", "Autre"];

export default function Recherche() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wholesale, setWholesale] = useState(false);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (router.query.q) setQuery(router.query.q);
  }, [router.query.q]);

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setSearched(true);
    const params = new URLSearchParams();
    params.set("search", q);
    params.set("limit", "20");
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (wholesale) params.set("wholesale", "true");
    if (location.trim()) params.set("location", location.trim());

    const shopParams = new URLSearchParams();
    shopParams.set("search", q);
    if (city) shopParams.set("city", city);

    const [prodRes, shopRes] = await Promise.all([
      api.get(`/products?${params.toString()}`),
      api.get(`/shops?${shopParams.toString()}`),
    ]);
    setProducts(prodRes.data.products);
    setShops(shopRes.data);
  };

  useEffect(() => {
    if (router.query.q) runSearch(router.query.q);
  }, [router.query.q, minPrice, maxPrice, wholesale, location, city]);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setWholesale(false);
    setLocation("");
    setCity("");
  };

  const activeFilterCount = [minPrice, maxPrice, wholesale, location, city].filter(Boolean).length;

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60, boxSizing: "border-box" }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
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
              boxSizing: "border-box",
            }}
          />
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: showFilters ? 12 : 24,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Filtres {activeFilterCount > 0 && `(${activeFilterCount})`} {showFilters ? "▲" : "▼"}
        </button>

        {showFilters && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Ville</div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, background: "var(--white)" }}
              >
                <option value="">Toutes les villes</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Prix (FCFA)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ width: "50%", minWidth: 0, boxSizing: "border-box", padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ width: "50%", minWidth: 0, boxSizing: "border-box", padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Localisation (allée du marché)</div>
              <input
                placeholder="ex: Allée 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={wholesale} onChange={(e) => setWholesale(e.target.checked)} />
              Disponible en gros/demi-gros uniquement
            </label>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                style={{ fontSize: 12, color: "var(--terracotta-dark)", fontWeight: 600, alignSelf: "flex-start" }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

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
                      {shop.city} {shop.location?.allee} {shop.location?.numero}
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
