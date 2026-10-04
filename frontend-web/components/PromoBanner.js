import { useState, useEffect } from "react";

export const POPUP_FONTS = {
  moderne: { label: "Moderne", family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", weight: 700, upper: false },
  elegante: { label: "Élégante", family: "Georgia, 'Times New Roman', serif", weight: 700, upper: false },
  impact: { label: "Impact", family: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif", weight: 400, upper: true },
  manuscrite: { label: "Manuscrite", family: "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive", weight: 700, upper: false },
};

export const POPUP_SIZES = {
  petite: { label: "Petite", title: 15, msg: 12, img: 44 },
  moyenne: { label: "Moyenne", title: 18, msg: 14, img: 56 },
  grande: { label: "Grande", title: 22, msg: 16, img: 72 },
};

const CSS = `
@keyframes pb-in{0%{transform:translateY(130%);opacity:0}60%{transform:translateY(-8%);opacity:1}80%{transform:translateY(3%)}100%{transform:translateY(0)}}
@keyframes pb-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes pb-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.pb-card{animation:pb-in .7s cubic-bezier(.2,.8,.2,1) both}
.pb-img{animation:pb-pulse 1.6s ease-in-out infinite}
.pb-bar{transform-origin:left;animation:pb-bar linear forwards}
@media (prefers-reduced-motion: reduce){.pb-card,.pb-img,.pb-bar{animation:none}}
`;

function textColorFor(bg) {
  const m = /^#([0-9a-f]{6})$/i.exec(bg);
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 160 ? "#111" : "#fff";
}

export function BannerCard({ popup, themeColor, duration, animate = true, onClose, href }) {
  const font = POPUP_FONTS[popup.font] || POPUP_FONTS.moderne;
  const size = POPUP_SIZES[popup.size] || POPUP_SIZES.moyenne;
  const bg = /^#[0-9a-f]{6}$/i.test(themeColor || "") ? themeColor : "#111111";
  const fg = textColorFor(bg);
  const Tag = href ? "a" : "div";
  const linkProps = href ? { href } : {};

  return (
    <Tag
      {...linkProps}
      className={animate ? "pb-card" : ""}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: 460,
        boxSizing: "border-box",
        padding: 12,
        paddingRight: 36,
        borderRadius: 16,
        background: bg,
        color: fg,
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
        overflow: "hidden",
        textDecoration: "none",
        pointerEvents: "auto",
        cursor: href ? "pointer" : "default",
      }}
    >
      <style>{CSS}</style>
      {popup.image ? (
        <img
          className={animate ? "pb-img" : ""}
          src={popup.image}
          alt=""
          style={{ width: size.img, height: size.img, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
        />
      ) : (
        <div className={animate ? "pb-img" : ""} style={{ fontSize: size.img * 0.7, flexShrink: 0 }}>🎉</div>
      )}
      <div style={{ minWidth: 0 }}>
        {popup.title && (
          <div
            style={{
              fontSize: size.title,
              fontFamily: font.family,
              fontWeight: font.weight,
              textTransform: font.upper ? "uppercase" : "none",
              lineHeight: 1.15,
            }}
          >
            {popup.title}
          </div>
        )}
        {popup.message && (
          <div style={{ fontSize: size.msg, fontFamily: font.family, opacity: 0.92, marginTop: 2, lineHeight: 1.3 }}>
            {popup.message}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Fermer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          style={{ position: "absolute", top: 4, right: 8, fontSize: 22, color: fg, background: "transparent", border: "none", opacity: 0.8 }}
        >
          ×
        </button>
      )}
      {animate && duration ? (
        <div
          className="pb-bar"
          style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: "100%", background: fg, opacity: 0.55, animationDuration: duration + "ms" }}
        />
      ) : null}
    </Tag>
  );
}

export default function PromoBanner({ popup, shopId, themeColor, href }) {
  const [visible, setVisible] = useState(false);
  const [dur, setDur] = useState(0);
  const [round, setRound] = useState(0);
  const enabled = !!popup?.enabled && !!(popup.title || popup.message || popup.image);
  const closedKey = "shopyz_banner_closed_" + shopId;
  const lastKey = "shopyz_banner_last_" + shopId;

  useEffect(() => {
    if (!enabled || !shopId) return;
    const isClosed = () => {
      try { return !!sessionStorage.getItem(closedKey); } catch { return false; }
    };
    let last = 0;
    try { last = Number(sessionStorage.getItem(lastKey)) || 0; } catch {}
    let first = !last;
    let stopped = false;
    let timer;

    const show = () => {
      if (stopped || isClosed()) return;
      const d = first ? 8000 : 5000;
      first = false;
      try { sessionStorage.setItem(lastKey, String(Date.now())); } catch {}
      setDur(d);
      setRound((r) => r + 1);
      setVisible(true);
      timer = setTimeout(() => {
        setVisible(false);
        timer = setTimeout(show, 30000);
      }, d);
    };

    const wait = last ? Math.max(1500, last + 35000 - Date.now()) : 1500;
    timer = setTimeout(show, wait);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [enabled, shopId]);

  if (!enabled || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        justifyContent: "center",
        padding: "0 12px",
        pointerEvents: "none",
        zIndex: 90,
      }}
    >
      <BannerCard
        key={round}
        popup={popup}
        themeColor={themeColor}
        duration={dur}
        href={href}
        onClose={() => {
          try { sessionStorage.setItem(closedKey, "1"); } catch {}
          setVisible(false);
        }}
      />
    </div>
  );
}
