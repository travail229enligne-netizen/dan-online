import { useState, useEffect } from "react";

export default function ProductCard({ product, onAddToCart }) {
  const images = product.images && product.images.length > 0 ? product.images : [null];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <a href={`/produit/${product._id}`}>
        <div
          style={{
            height: 200,
            background: images[active] ? `#eee url(${images[active]}) center/cover no-repeat` : "#eee",
            transition: "background-image 0.3s ease",
            position: "relative",
          }}
        >
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
              {images.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i === active ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </a>
      <div style={{ padding: 12 }}>
        <a href={`/produit/${product._id}`}>
          <div style={{ color: "var(--terracotta-dark)", fontWeight: 700 }}>
            {product.price?.toLocaleString("fr-FR")} FCFA
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{product.name}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 12, marginBottom: 10 }}>
            {product.shop?.name}
          </div>
        </a>
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => onAddToCart?.(product)}>
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
