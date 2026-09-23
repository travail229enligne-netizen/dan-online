import { useEffect } from "react";

const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="stage">
        <div className="path" />

        <div className="rig">
          <div className="shadow" />
          <div className="bounce">
            <img
              src="https://res.cloudinary.com/op1wrztj/image/upload/v1790159662/f8qmd314iffu0jlhpojl.jpg"
              alt="Panda Shopyz"
              className="panda-img"
            />
          </div>
        </div>

        <div className="letters">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="letter"
              style={{ animationDelay: `${0.7 + i * 0.42}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          overflow: hidden;
          animation: fadeOut 0.6s ease 3.6s forwards;
        }
        .stage {
          position: relative;
          width: 100%;
          max-width: 480px;
          height: 380px;
        }
        .path {
          position: absolute;
          left: 6%;
          right: 6%;
          top: 230px;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(17, 17, 17, 0.12) 15%,
            rgba(17, 17, 17, 0.12) 85%,
            transparent
          );
        }
        .rig {
          position: absolute;
          left: -220px;
          top: 60px;
          width: 220px;
          animation: rigMove 3.2s cubic-bezier(0.45, 0, 0.4, 1) 0.15s forwards;
        }
        .bounce {
          animation: walkBounce 0.42s ease-in-out infinite;
        }
        .panda-img {
          display: block;
          width: 220px;
          height: auto;
          object-fit: contain;
          transform: scaleX(-1);
          filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.08));
        }
        .shadow {
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 130px;
          height: 16px;
          background: rgba(17, 17, 17, 0.14);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: shadowPulse 0.42s ease-in-out infinite;
          filter: blur(2px);
        }
        .letters {
          position: absolute;
          left: 50%;
          top: 260px;
          display: flex;
          gap: 4px;
          transform: translateX(-50%);
        }
        .letter {
          font-family: var(--font-display);
          font-size: 52px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--ink);
          opacity: 0;
          transform: translateY(14px) scale(0.7);
          animation: letterPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes rigMove {
          0% {
            left: -220px;
          }
          100% {
            left: calc(100% + 20px);
          }
        }
        @keyframes walkBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes shadowPulse {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-50%) scale(0.82);
            opacity: 0.55;
          }
        }
        @keyframes letterPop {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
