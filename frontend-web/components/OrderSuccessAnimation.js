import { useMemo } from "react";

const CONFETTI_COLORS = ["var(--terracotta)", "var(--green-dark)", "var(--gold)", "var(--ink)"];

export default function OrderSuccessAnimation() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 5,
        delay: Math.random() * 0.25,
        duration: 0.9 + Math.random() * 0.5,
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="order-success-wrap">
      <div className="confetti-layer">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.3,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <svg viewBox="0 0 80 80" width="72" height="72" className="success-svg">
        <circle cx="40" cy="40" r="36" fill="none" stroke="var(--green-dark)" strokeWidth="4" className="success-circle" />
        <path d="M24 41 L35 52 L57 28" fill="none" stroke="var(--green-dark)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="success-check" />
      </svg>

      <style jsx>{`
        .order-success-wrap {
          position: relative;
          display: inline-block;
        }
        .success-svg {
          display: block;
        }
        .success-circle {
          stroke-dasharray: 226;
          stroke-dashoffset: 226;
          animation: drawCircle 0.5s ease-out forwards;
        }
        .success-check {
          stroke-dasharray: 46;
          stroke-dashoffset: 46;
          animation: drawCheck 0.35s ease-out 0.45s forwards;
        }
        .confetti-layer {
          position: absolute;
          top: -10px;
          left: -40px;
          right: -40px;
          height: 10px;
          pointer-events: none;
        }
        .confetti-piece {
          position: absolute;
          top: 0;
          border-radius: 1px;
          opacity: 0;
          animation-name: confettiFall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes confettiFall {
          0% {
            top: 0;
            opacity: 1;
          }
          100% {
            top: 70px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
