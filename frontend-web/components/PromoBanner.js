import { useState, useEffect } from "react";

export const POPUP_FONTS = {
  moderne: { label: "Moderne", family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", weight: 700, upper: false },
  elegante: { label: "Élégante", family: "Georgia, 'Times New Roman', serif", weight: 700, upper: false },
  impact: { label: "Impact", family: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif", weight: 400, upper: true },
  manuscrite: { label: "Manuscrite", family: "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive", weight: 700, upper: false },
};

export const POPUP_SIZES = {
  petite: { label: "Petite", box: 150, title: 14, msg: 11 },
  moyenne: { label: "Moyenne", box: 200, title: 17, msg: 13 },
  grande: { label: "Grande", box: 250, title: 20, msg: 15 },
};

const CSS = `
@keyframes pb-in{0%{transform:translateX(130%);opacity:0}60%{transform:translateX(-8%);opacity:1}80%{transform:translateX(3%)}100%{transform:translateX(0)}}
@keyframes pb-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes pb-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.pb-card{animation:pb-in .7s cubic-bezier(.2,.8,.2,1) both}
.pb-img{animation:pb-pulse 1.8s ease-in-out infinite}
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

const clamp = (n) => ({ display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" });

export function BannerCard({ popup, themeColor, duration, animate = true, onClose, href }) {
  const font = POPUP_FONTS[popup.font] || POPUP_FONTS.moderne;
  const size = POPUP_SIZES[popup.size] || POPUP_SIZES.moyenne;
  const pick = /^#[0-9a-f]{6}$/i.test(popup.bgColor || "") ? popup.bgColor : themeColor;
  const bg = /^#[0-9a-f]{6}$/i.test(pick || "") ? pick : "#111111";
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
        flexDirection: "column",
        width: size.box,
        maxWidth: "62vw",
        aspectRatio: "1 / 1",
        boxSizing: "border-box",
        padding: 10,
        borderRadius: 20,
        background: bg,
        color: fg,
        boxShadow: "0 10px 32px rgba(0,0,0,0.4)",
        overflow: "hidden",
        textDecoration: "none",
        pointerEvents: "auto",
        cursor: href ? "pointer" : "default",
      }}
    >
      <style>{CSS}</style>
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {popup.image ? (
          <img
            className={animate ? "pb-img" : ""}
            src={popup.image}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
          />
        ) : (
          <div className={animate ? "pb-img" : ""} style={{ fontSize: size.box * 0.35 }}>🎉</div>
        )}
      </div>
      <div style={{ paddingTop: 8, paddingBottom: 4, textAlign: "center", fontFamily: font.family }}>
        {popup.title && (
          <div
            style={{
              ...clamp(2),
              fontSize: size.title,
              fontWeight: font.weight,
              textTransform: font.upper ? "uppercase" : "none",
              lineHeight: 1.15,
            }}
          >
            {popup.title}
          </div>
        )}
        {popup.message && (
          <div style={{ ...clamp(3), fontSize: size.msg, opacity: 0.92, marginTop: 3, lineHeight: 1.25 }}>
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
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 26,
            height: 26,
            borderRadius: "50%",
            fontSize: 18,
            lineHeight: "24px",
            color: "#fff",
            background: "rgba(0,0,0,0.45)",
            border: "none",
            padding: 0,
          }}
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
  const expired = !!popup?.endsAt && new Date(popup.endsAt).getTime() < Date.now();
  const enabled = !!popup?.enabled && !expired && !!(popup.title || popup.message || popup.image);
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
      if (popup?.endsAt && new Date(popup.endsAt).getTime() < Date.now()) return;
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
        justifyContent: "flex-end",
        padding: "0 12px",
        pointerEvents: "none",
        zIndex: 90,
        overflow: "hidden",
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
