import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";

export default function ProduitDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const [product, setProduct] = useState(undefined);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((r) => setProduct(r.data)).catch(() => setProduct(null));
  }, [id]);

  if (product === undefined) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40 }}>
          <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Produit introuvable.</p>
        </main>
      </>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [null];

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div
          style={{
            height: 280,
            borderRadius: "var(--radius-md)",
            background: images[activeImage]
              ? `#eee url(${images[activeImage]}) center/cover no-repeat`
              : "#eee",
            marginBottom: 10,
          }}
        />

        {images.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  borderRadius: 8,
                  border: i === activeImage ? "2px solid var(--ink)" : "1px solid var(--line)",
                  background: img ? `#eee url(${img}) center/cover no-repeat` : "#eee",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 20, marginBottom: 6 }}>{product.name}</h1>
        {product.shop?.name && (
          <a href={`/boutique/${product.shop.slug}`} style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Vendu par {product.shop.name}
          </a>
        )}

        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--terracotta-dark)", margin: "14px 0" }}>
          {product.price?.toLocaleString("fr-FR")} FCFA
          <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-soft)" }}> / {product.unit}</span>
        </div>

        {product.stock === 0 ? (
          <p style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600, marginBottom: 16 }}>
            Rupture de stock
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
            {product.stock} {product.unit} disponibles
          </p>
        )}

        {product.description && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>Description</h2>
            <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{product.description}</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 13 }}>Quantité</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            style={{ width: 70, padding: 8, border: "1px solid var(--line)", borderRadius: 8 }}
          />
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", padding: 14, fontSize: 15 }}
          disabled={product.stock === 0}
          onClick={() => {
            addToCart(product, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
        >
          {product.stock === 0 ? "Indisponible" : added ? "Ajouté !" : "Ajouter au panier"}
        </button>
      </main>
    </>
  );
}
