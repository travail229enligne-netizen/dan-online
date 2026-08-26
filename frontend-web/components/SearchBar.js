import { useState } from "react";
import { useRouter } from "next/router";

export default function SearchBar({ size = "compact", placeholder = "Rechercher un produit, une boutique, un plat..." }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const large = size === "large";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: large ? "14px 18px" : "10px 16px",
          borderRadius: 999,
          border: "1px solid var(--line)",
          fontSize: large ? 15 : 13,
          boxSizing: "border-box",
          background: "var(--white)",
        }}
      />
      <button
        type="submit"
        aria-label="Rechercher"
        style={{
          width: large ? 50 : 40,
          height: large ? 50 : 40,
          borderRadius: "50%",
          border: "1px solid var(--line)",
          background: "var(--ink)",
          color: "var(--white)",
          fontSize: large ? 18 : 14,
          flexShrink: 0,
        }}
      >
        🔍
      </button>
    </form>
  );
}
