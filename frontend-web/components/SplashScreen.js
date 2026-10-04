import { useEffect, useState } from "react";

const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState("wipe"); // wipe -> glitch -> shine -> pulse -> out

  useEffect(() => {
    const already = typeof window !== "undefined" ? window.sessionStorage.getItem("shopyz_splash_seen") : "1";
    if (already) return;

    setShow(true);
    window.sessionStorage.setItem("shopyz_splash_seen", "1");

    const t1 = setTimeout(() => setPhase("glitch"), 900);
    const t2 = setTimeout(() => setPhase("shine"), 1150);
    const t3 = setTimeout(() => setPhase("pulse"), 1650);
    const t4 = setTimeout(() => setPhase("out"), 2150);
    const t5 = setTimeout(() => setShow(false), 2650);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  if (!show) return null;

  return (
    <div className={`splash ${phase === "out" ? "splash-out" : ""}`}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="shopyz-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
        </filter>
      </svg>

      <div className="wave-layer">
        <div className="goo-group">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="blob b4" />
          <span className="cart-rider" aria-hidden="true">
            <svg viewBox="0 0 48 40" width="34" height="28">
              <path
                d="M2 4h5l5 22h22l5-15H13"
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="34" r="3.2" fill="#fff" />
              <circle cx="30" cy="34" r="3.2" fill="#fff" />
            </svg>
          </span>
        </div>
      </div>

      <h1 className={`wordmark ${phase === "glitch" ? "glitch" : ""} ${phase === "shine" || phase === "pulse" ? "settled" : ""} ${phase === "pulse" ? "pulse" : ""}`}>
        {LETTERS.map((l, i) => (
          <span key={i} className="letter" style={{ "--i": i }}>
            {l}
          </span>
        ))}
        {(phase === "shine" || phase === "pulse") && <span className="shine" />}
      </h1>

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .splash-out {
          opacity: 0;
          transform: scale(1.04);
          pointer-events: none;
        }

        .wave-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          filter: url(#shopyz-goo);
        }
        .goo-group {
          position: absolute;
          top: 50%;
          left: -20%;
          transform: translateY(-50%);
          animation: sweep 0.95s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .blob {
          position: absolute;
          background: #111;
          border-radius: 50%;
        }
        .b1 { width: 420px; height: 420px; top: -210px; left: 0; }
        .b2 { width: 260px; height: 260px; top: -60px; left: 60px; animation: wobble 0.5s ease-in-out infinite alternate; }
        .b3 { width: 180px; height: 500px; top: -250px; left: -60px; border-radius: 40%; }
        .b4 { width: 160px; height: 160px; top: 40px; left: 20px; animation: wobble 0.4s ease-in-out infinite alternate-reverse; }
        .cart-rider {
          position: absolute;
          top: -14px;
          left: 170px;
          filter: none;
        }

        @keyframes sweep {
          0% { left: -40%; }
          100% { left: 115%; }
        }
        @keyframes wobble {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }

        .wordmark {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 2px;
          margin: 0;
          font-family: "Space Grotesk", sans-serif;
          font-weight: 700;
          font-size: clamp(32px, 9vw, 56px);
          letter-spacing: 2px;
          color: #111;
          mix-blend-mode: normal;
        }
        .letter {
          display: inline-block;
          opacity: 1;
        }

        .glitch .letter {
          animation: glitchJitter 0.22s steps(2, end) 1;
        }
        @keyframes glitchJitter {
          0% { transform: translate(0, 0); text-shadow: 0 0 #000; }
          25% { transform: translate(-2px, 1px); text-shadow: 2px 0 #e11, -2px 0 #0cf; }
          50% { transform: translate(2px, -1px); text-shadow: -2px 0 #e11, 2px 0 #0cf; }
          75% { transform: translate(-1px, 0); text-shadow: 1px 0 #e11, -1px 0 #0cf; }
          100% { transform: translate(0, 0); text-shadow: 0 0 #000; }
        }

        .shine {
          position: absolute;
          top: -40%;
          left: -30%;
          width: 40%;
          height: 180%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.9) 50%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: shineSweep 0.5s ease forwards;
          pointer-events: none;
        }
        @keyframes shineSweep {
          from { left: -30%; }
          to { left: 110%; }
        }

        .pulse {
          animation: pulseScale 0.5s ease;
        }
        @keyframes pulseScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
