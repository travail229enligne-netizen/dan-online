import { useState } from "react";
import { useCart } from "../lib/cart";

export default function CartBar() {
  const { items, count, total, updateQuantity, removeFromCart } = useCart();
  const [expanded, setExpanded] = useState(false);

  if (count === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 40,
      }}
    >
      {expanded && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 14,
            marginBottom: 8,
            maxHeight: "50vh",
            overflowY: "auto",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          }}
        >
          {items.map((it) => (
            <div
              key={it.productId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {it.price.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                  style={{ width: 26, height: 26, borderRadius: 6, background: "var(--cream)", fontSize: 14 }}
                >
                  −
                </button>
                <span style={{ fontSize: 13, minWidth: 18, textAlign: "center" }}>{it.quantity}</span>
                <button
                  onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                  style={{ width: 26, height: 26, borderRadius: 6, background: "var(--cream)", fontSize: 14 }}
                >
                  +
                </button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, minWidth: 60, textAlign: "right" }}>
                {(it.price * it.quantity).toLocaleString("fr-FR")}
              </div>
              <button
                onClick={() => removeFromCart(it.productId)}
                aria-label="Retirer"
                style={{ fontSize: 16, color: "var(--terracotta-dark)", padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          background: "var(--ink)",
          color: "var(--white)",
          borderRadius: 16,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        <button onClick={() => setExpanded(!expanded)} style={{ textAlign: "left", color: "var(--white)" }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {count} article{count > 1 ? "s" : ""} {expanded ? "▼" : "▲"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {total.toLocaleString("fr-FR")} FCFA
          </div>
        </button>
        <a
          href="/commande"
          style={{
            background: "var(--white)",
            color: "var(--ink)",
            fontWeight: 700,
            fontSize: 13,
            padding: "10px 18px",
            borderRadius: 10,
          }}
        >
          Passer la commande
        </a>
      </div>
    </div>
  );
}
