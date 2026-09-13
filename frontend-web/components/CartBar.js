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
        right: 16,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {expanded && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 14,
            marginBottom: 10,
            width: "min(88vw, 340px)",
            maxHeight: "60vh",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            boxSizing: "border-box",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 12,
              marginTop: 4,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {total.toLocaleString("fr-FR")} FCFA
            </div>
            <a
              href="/commande"
              style={{
                background: "var(--ink)",
                color: "var(--white)",
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
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        aria-label="Voir le panier"
        style={{
          position: "relative",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--white)",
          fontSize: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        🛒
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--terracotta)",
            color: "var(--white)",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      </button>
    </div>
  );
}
