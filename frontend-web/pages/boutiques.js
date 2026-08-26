import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";

const businessIcons = {
  restaurant: "🍽️",
  supermarche: "🛒",
  grossiste: "📦",
  artisan: "🛠️",
  boutique: "🏪",
};

export default function Boutiques() {
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q && q.trim()) params.set("search", q.trim());
    api
      .get(`/shops?${params.toString()}`)
      .then((r) => setShops(r.data))
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
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Toutes les boutiques</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
          Boutiques, restaurants, supermarchés, grossistes et artisans partenaires d'EasyShop.
        </p>

        <form onSubmit={handleSubmit} style={{ position: "relative", marginBottom: 22 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une boutique par nom..."
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: "var(--ink)",
                      color: "var(--white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 18,
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
                    {shop.city} {shop.location?.allee} {shop.location?.numero}
                  </div>
                  {shop.isVerified && (
                    <span style={{ fontSize: 11, color: "var(--ink)" }}>✓ Vérifié</span>
                  )}
                </div>
              </a>
            ))}
            {shops.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune boutique trouvée.</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
