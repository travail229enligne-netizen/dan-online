export default function HeroBanner({ title, subtitle, ctaLabel = "Commander maintenant", onCtaClick }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
        borderRadius: "var(--radius-lg)",
        padding: "32px 24px",
        color: "var(--white)",
        marginTop: 16,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--white)", fontSize: 26, lineHeight: 1.25, marginBottom: 12, maxWidth: 480 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "0 0 18px", color: "#DCE9E0", maxWidth: 480, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {onCtaClick && (
        <button className="btn-primary" onClick={onCtaClick}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
