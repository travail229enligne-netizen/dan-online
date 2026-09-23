import { useEffect, useMemo } from "react";

const PANDA_URL =
  "https://res.cloudinary.com/op1wrztj/image/upload/e_trim,e_replace_color:white:25:edede9/v1790159662/f8qmd314iffu0jlhpojl.png";

const CONFETTI_COLORS = ["#FF6B4A", "#2DD4BF", "#FFC145", "#6366F1", "#F472B6"];

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 5000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.6,
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="splash">
      <div className="bg-gradient" />

      <div className="confetti-layer">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.4,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="rig">
        <div className="halo" />
        <div className="shadow" />
        <div className="bounce">
          <img
            src={PANDA_URL}
            alt="Panda Shopyz"
            className="panda-img"
            loading="eager"
          />
        </div>
      </div>

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          background: #ffffff;
          z-index: 9999;
          overflow: hidden;
          animation: fadeOut 0.6s ease 4.4s forwards;
        }
        .bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            #fff1e9,
            #e8fbf7,
            #f2f0ff,
            #fff7e0
          );
          background-size: 300% 300%;
          animation: gradientShift 6s ease-in-out infinite;
        }
        .confetti-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .confetti {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          opacity: 0.85;
          animation: confettiFall linear forwards;
        }
        .rig {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-260px, -50%);
          animation: rigMove 4.2s cubic-bezier(0.45, 0, 0.4, 1) 0.1s forwards;
        }
        .halo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 340px;
          height: 340px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(255, 107, 74, 0.35) 0%,
            rgba(255, 107, 74, 0.12) 45%,
            transparent 70%
          );
          filter: blur(6px);
          animation: haloPulse 1.6s ease-in-out infinite;
        }
        .bounce {
          position: relative;
          animation: walkBounce 0.4s ease-in-out infinite;
        }
        .panda-img {
          display: block;
          height: min(72vh, 520px);
          width: auto;
          object-fit: contain;
          transform: scaleX(-1);
          filter: brightness(0) saturate(100%) invert(56%) sepia(94%)
            saturate(1352%) hue-rotate(346deg) brightness(101%) contrast(101%)
            drop-shadow(0 10px 16px rgba(0, 0, 0, 0.15));
          -webkit-mask-image: radial-gradient(
            120% 120% at 50% 50%,
            black 88%,
            transparent 100%
          );
          mask-image: radial-gradient(
            120% 120% at 50% 50%,
            black 88%,
            transparent 100%
          );
        }
        .shadow {
          position: absolute;
          left: 50%;
          bottom: 6%;
          width: 40%;
          height: 3%;
          background: rgba(17, 17, 17, 0.14);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: shadowPulse 0.4s ease-in-out infinite;
          filter: blur(3px);
        }

        @keyframes gradientShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes confettiFall {
          0% {
            top: -20px;
            opacity: 0.9;
          }
          100% {
            top: 105%;
            opacity: 0.2;
          }
        }
        @keyframes rigMove {
          0% {
            transform: translate(-260px, -50%);
          }
          100% {
            transform: translate(calc(50vw + 260px), -50%);
          }
        }
        @keyframes haloPulse {
          0%,
          100% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }
        @keyframes walkBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes shadowPulse {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-50%) scale(0.8);
            opacity: 0.5;
          }
        }
        @keyframes fadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
}
