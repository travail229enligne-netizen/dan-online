import { useState } from "react";
import { useRouter } from "next/router";

export default function HeroBanner({ title, subtitle, secondaryLabel = "Découvrir les boutiques", onSecondaryClick }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
        borderRadius: "var(--radius-lg)",
        padding: "32px 24px",
        color: "var(--white)",
        marginTop: 16,
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--white)", fontSize: 28, lineHeight: 1.2, marginBottom: 8 }}>
        {title}
      </h2>
      {subtitle && <p style={{ margin: "0 0 22px", color: "#DCE9E0", fontSize: 14 }}>{subtitle}</p>}

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Un produit, une boutique, un plat..."
          style={{
            flex: 1,
            padding: "13px 16px",
            borderRadius: 999,
            border: "none",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          aria-label="Rechercher"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: "var(--white)",
            color: "var(--green-dark)",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🔍
        </button>
      </form>

      {onSecondaryClick && (
        <button
          onClick={onSecondaryClick}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--white)",
            textDecoration: "underline",
          }}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
