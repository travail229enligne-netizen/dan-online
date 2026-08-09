export default function ProductCard({ product, onAddToCart }) {
  const image = product.images && product.images[0];

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
            height: 120,
            background: image ? `#eee url(${image}) center/cover no-repeat` : "#eee",
          }}
        />
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
