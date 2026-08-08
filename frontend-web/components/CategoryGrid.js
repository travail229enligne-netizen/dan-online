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
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: "18px 10px",
              textAlign: "center",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {cat.name}
          </a>
        ))}
      </div>
    </section>
  );
}
