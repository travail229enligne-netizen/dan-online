export default function CategoryGrid({ categories = [] }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h3 style={{ fontSize: 18, marginBottom: 14 }}>Nos Allées Numériques</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 12 }}>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/categorie/${cat.slug}`}
            style={{
              background: cat.color || "var(--terracotta)",
              borderRadius: "var(--radius-md)",
              padding: "18px 10px",
              textAlign: "center",
              color: "var(--white)",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>{cat.icon}</div>
            {cat.name}
          </a>
        ))}
      </div>
    </section>
  );
}
