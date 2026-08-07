export default function ProductCard({ product, onAddToCart }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 120,
          background: `#eee url(${product.images?.[0] || ""}) center/cover no-repeat`,
        }}
      />
      <div style={{ padding: 12 }}>
        <div style={{ color: "var(--terracotta-dark)", fontWeight: 700 }}>
          {product.price?.toLocaleString("fr-FR")} FCFA
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{product.name}</div>
        <div style={{ color: "var(--ink-soft)", fontSize: 12, marginBottom: 10 }}>
          {product.shop?.name}
        </div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => onAddToCart?.(product)}>
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
