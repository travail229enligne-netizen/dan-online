import { useCart } from "../lib/cart";

export default function CartBar() {
  const { count, total } = useCart();

  if (count === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        background: "var(--ink)",
        color: "var(--white)",
        borderRadius: 16,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        zIndex: 40,
      }}
    >
      <div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {count} article{count > 1 ? "s" : ""}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {total.toLocaleString("fr-FR")} FCFA
        </div>
      </div>
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
        Valider la commande
      </a>
    </div>
  );
}
