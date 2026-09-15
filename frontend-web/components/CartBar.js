import { useState, useRef, useEffect } from "react";
import { useCart } from "../lib/cart";

const BUTTON_SIZE = 56;
const MARGIN = 16;
const PANEL_GAP = 10;
const EDGE_PADDING = 8;

export default function CartBar() {
  const { items, count, total, updateQuantity, removeFromCart } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState(null);
  const dragInfo = useRef({ dragging: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && pos === null) {
      setPos({
        x: window.innerWidth - BUTTON_SIZE - MARGIN,
        y: window.innerHeight - BUTTON_SIZE - MARGIN - 20,
      });
    }
  }, [pos]);

  const clampButton = (x, y) => {
    const maxX = window.innerWidth - BUTTON_SIZE - 4;
    const maxY = window.innerHeight - BUTTON_SIZE - 4;
    return { x: Math.min(Math.max(4, x), maxX), y: Math.min(Math.max(4, y), maxY) };
  };

  const handlePointerDown = (e) => {
    dragInfo.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e) => {
    const info = dragInfo.current;
    if (!info.dragging) return;
    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) info.moved = true;
    setPos(clampButton(info.originX + dx, info.originY + dy));
  };

  const handlePointerUp = () => {
    dragInfo.current.dragging = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  };

  const handleClick = () => {
    if (dragInfo.current.moved) {
      dragInfo.current.moved = false;
      return;
    }
    setExpanded((e) => !e);
  };

  if (count === 0 || !pos) return null;

  const panelWidth = Math.min(340, window.innerWidth * 0.88);
  const desiredPanelLeft = pos.x + BUTTON_SIZE / 2 - panelWidth / 2;
  const panelLeft = Math.min(Math.max(EDGE_PADDING, desiredPanelLeft), window.innerWidth - panelWidth - EDGE_PADDING);

  const buttonCenterY = pos.y + BUTTON_SIZE / 2;
  const openUpward = buttonCenterY > window.innerHeight / 2;

  const panelStyle = openUpward
    ? { bottom: window.innerHeight - pos.y + PANEL_GAP }
    : { top: pos.y + BUTTON_SIZE + PANEL_GAP };

  return (
    <>
      {expanded && (
        <div
          style={{
            position: "fixed",
            left: panelLeft,
            ...panelStyle,
            zIndex: 41,
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 14,
            width: panelWidth,
            maxHeight: "50vh",
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{total.toLocaleString("fr-FR")} FCFA</div>
            <a
              href="/commande"
              style={{ background: "var(--ink)", color: "var(--white)", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 10 }}
            >
              Passer la commande
            </a>
          </div>
        </div>
      )}

      <button
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        aria-label="Voir le panier"
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 40,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: "50%",
          background: "#D4AF37",
          color: "var(--white)",
          fontSize: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          touchAction: "none",
          cursor: "grab",
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
    </>
  );
}
