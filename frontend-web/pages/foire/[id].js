import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";

export default function FoireDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [fair, setFair] = useState(undefined);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    api.get(`/fairs/${id}`).then((r) => setFair(r.data)).catch(() => setFair(null));
  }, [id]);

  if (fair === undefined) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!fair) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Foire introuvable.</p>
        </main>
      </>
    );
  }

  const acceptedShopIds = new Set(fair.participants.filter((p) => p.status === "accepted").map((p) => p.shop?._id));
  const products = fair.entries
    .filter((e) => acceptedShopIds.has(e.shop?._id) && e.product)
    .map((e) => ({ ...e.product, shop: e.shop }));

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingBottom: 60 }}>
        {fair.bannerImage ? (
          <div style={{ width: "100%", aspectRatio: "16 / 7", overflow: "hidden", borderRadius: "var(--radius-lg)", marginTop: 16, background: "var(--ink)" }}>
            <img
              src={fair.bannerImage}
              alt={fair.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 7",
              borderRadius: "var(--radius-lg)",
              marginTop: 16,
              background: "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--white)",
              fontFamily: "var(--font-display)",
              fontSize: 24,
              textAlign: "center",
              padding: 20,
              boxSizing: "border-box",
            }}
          >
            {fair.title}
          </div>
        )}
        <h1 style={{ fontSize: 22, marginTop: 18, marginBottom: 6 }}>{fair.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          <span>📅</span>
          <span>{new Date(fair.startDate).toLocaleDateString("fr-FR")} → {new Date(fair.endDate).toLocaleDateString("fr-FR")}</span>
        </div>
        {fair.description && <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{fair.description}</p>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {[...acceptedShopIds].map((shopId) => {
            const p = fair.participants.find((p) => p.shop?._id === shopId);
            return (
              <a
                key={shopId}
                href={`/boutique/${p.shop?.slug}`}
                style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "var(--cream)", color: "var(--ink)" }}
              >
                {p.shop?.name}
              </a>
            );
          })}
        </div>

        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Produits de la Foire ({products.length})</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onAddToCart={(prod) => addToCart(prod, 1)} />
          ))}
          {products.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun produit ajouté pour l'instant.</p>}
        </div>
      </main>
    </>
  );
}
