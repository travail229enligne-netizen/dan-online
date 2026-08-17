import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";

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

function whatsappLink(phone, shopName) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(`Bonjour, je vous contacte depuis EasyShop au sujet de votre boutique ${shopName}.`);
  return `https://wa.me/${digits}?text=${message}`;
}

const sortOptions = [
  { value: "recent", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

export default function BoutiquePublique() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [reviews, setReviews] = useState({ reviews: [], average: 0, count: 0 });
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/shops/${slug}`)
      .then((r) => {
        setShop(r.data);
        api.get(`/reviews/shop/${r.data._id}`).then((rr) => setReviews(rr.data)).catch(() => {});
        api.get(`/collections/shop/${r.data._id}`).then((cr) => setCollections(cr.data)).catch(() => {});
        if (user?.role === "client") {
          api.get(`/follows/status/${r.data._id}`).then((fr) => setFollowing(fr.data.following)).catch(() => {});
        }
        return api.get(`/products?shop=${r.data._id}&limit=50`);
      })
      .then((r) => setProducts(r.data.products))
      .catch(() => setShop(null));
  }, [slug, user]);

  const toggleFollow = async () => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    setFollowBusy(true);
    try {
      if (following) {
        await api.delete(`/follows/${shop._id}`);
        setFollowing(false);
      } else {
        await api.post(`/follows/${shop._id}`);
        setFollowing(true);
      }
    } finally {
      setFollowBusy(false);
    }
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];

    if (activeTab !== "all") {
      const col = collections.find((c) => c._id === activeTab);
      if (col) {
        const ids = new Set(col.products.map((p) => p._id));
        list = list.filter((p) => ids.has(p._id));
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [products, collections, activeTab, search, sort]);

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
  const location = [shop.city, shop.location?.allee, shop.location?.numero].filter(Boolean).join(", ");
  const waLink = whatsappLink(shop.owner?.phone, shop.name);

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ color: "var(--white)", fontSize: 20 }}>{shop.name}</h1>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {user?.role === "client" && (
                <button
                  onClick={toggleFollow}
                  disabled={followBusy}
                  style={{
                    background: following ? "var(--white)" : "rgba(255,255,255,0.18)",
                    color: following ? theme : "var(--white)",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {following ? "Suivi ✓" : "Suivre"}
                </button>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "var(--white)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Contacter
                </a>
              )}
            </div>
          </div>

          {shop.description && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, maxWidth: 480, lineHeight: 1.5 }}>
              {shop.description}
            </p>
          )}

          {reviews.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <span style={{ color: "#fbbf24", fontSize: 14 }}>★</span>
              <span style={{ color: "var(--white)", fontSize: 13, fontWeight: 600 }}>
                {reviews.average.toFixed(1)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                ({reviews.count} avis)
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {shop.isProfessional && (
              <span
                style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "var(--white)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                Boutique professionnelle
              </span>
            )}
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
        {collections.filter((c) => c.products.length > 0).length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto" }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 20,
                border: activeTab === "all" ? "none" : "1px solid var(--line)",
                background: activeTab === "all" ? "var(--ink)" : "var(--white)",
                color: activeTab === "all" ? "var(--white)" : "var(--ink)",
                whiteSpace: "nowrap",
              }}
            >
              Tous les produits
            </button>
            {collections.filter((c) => c.products.length > 0).map((col) => (
              <button
                key={col._id}
                onClick={() => setActiveTab(col._id)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: activeTab === col._id ? "none" : "1px solid var(--line)",
                  background: activeTab === col._id ? "var(--ink)" : "var(--white)",
                  color: activeTab === col._id ? "var(--white)" : "var(--ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 14 }}>
          Produits {products.length > 0 && `(${visibleProducts.length})`}
        </h2>

        {products.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                padding: 10,
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: 10,
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 13,
                background: "var(--white)",
              }}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {products.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Cette boutique n'a pas encore de produits en ligne.
          </p>
        ) : visibleProducts.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Aucun produit ne correspond à ta recherche.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {visibleProducts.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
            ))}
          </div>
        )}

        {reviews.count > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>
              Avis clients ({reviews.count})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reviews.reviews.map((r) => (
                <div
                  key={r._id}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.client?.name || "Client"}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--green-dark)",
                          background: "#e8f5ee",
                          padding: "2px 8px",
                          borderRadius: 10,
                        }}
                      >
                        Achat vérifié
                      </span>
                    </div>
                    <span style={{ color: "#f5a623", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: "var(--ink)", marginTop: 6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
