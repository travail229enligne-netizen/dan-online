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
    <form onSubmit={handleSubmit} style={{ position: "relative", width: "100%" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: large ? "16px 50px 16px 20px" : "11px 42px 11px 16px",
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
          position: "absolute",
          right: large ? 6 : 4,
          top: "50%",
          transform: "translateY(-50%)",
          width: large ? 40 : 32,
          height: large ? 40 : 32,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "var(--ink-soft)",
          fontSize: large ? 18 : 14,
        }}
      >
        🔍
      </button>
    </form>
  );
}
