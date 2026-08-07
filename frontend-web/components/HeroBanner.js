export default function HeroBanner({ title, subtitle, ctaLabel = "Commander maintenant", onCtaClick }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
        borderRadius: "var(--radius-lg)",
        padding: "28px 24px",
        color: "var(--white)",
        marginTop: 16,
      }}
    >
      <h2 style={{ color: "var(--white)", fontSize: 26, lineHeight: 1.25, marginBottom: 8 }}>{title}</h2>
      {subtitle && <p style={{ margin: "0 0 18px", color: "#DCE9E0" }}>{subtitle}</p>}
      <button className="btn-primary" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    </div>
  );
}
