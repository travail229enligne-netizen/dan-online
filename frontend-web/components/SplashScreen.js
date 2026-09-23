import { useEffect } from "react";

const PANDA_URL =
  "https://res.cloudinary.com/op1wrztj/image/upload/e_trim,e_replace_color:white:25:edede9/v1790159662/f8qmd314iffu0jlhpojl.png";
const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="rig">
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

      <div className="letters">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="letter"
            style={{ animationDelay: `${0.6 + i * 0.4}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          background: #ffffff;
          z-index: 9999;
          overflow: hidden;
          animation: fadeOut 0.6s ease 4s forwards;
        }
        .rig {
          position: absolute;
          left: 50%;
          top: 42%;
          transform: translate(-260px, -50%);
          animation: rigMove 2.8s cubic-bezier(0.45, 0, 0.4, 1) 0.1s forwards;
        }
        .bounce {
          animation: walkBounce 0.4s ease-in-out infinite;
        }
        .panda-img {
          display: block;
          height: min(55vh, 380px);
          width: auto;
          object-fit: contain;
          transform: scaleX(-1);
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.1));
          -webkit-mask-image: radial-gradient(120% 120% at 50% 50%, black 88%, transparent 100%);
          mask-image: radial-gradient(120% 120% at 50% 50%, black 88%, transparent 100%);
        }
        .shadow {
          position: absolute;
          left: 50%;
          bottom: 8%;
          width: 40%;
          height: 3%;
          background: rgba(17, 17, 17, 0.14);
          border-radius: 50%;
          transform: translateX(-50%);
          animation: shadowPulse 0.4s ease-in-out infinite;
          filter: blur(3px);
        }
        .letters {
          position: absolute;
          left: 50%;
          top: 66%;
          display: flex;
          gap: 6px;
          transform: translateX(-50%);
        }
        .letter {
          font-family: var(--font-display);
          font-size: 54px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--ink);
          opacity: 0;
          transform: translateY(-140px);
          animation: letterDrop 0.7s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
        }

        @keyframes rigMove {
          0% {
            transform: translate(-260px, -50%);
          }
          100% {
            transform: translate(calc(50vw + 260px), -50%);
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
        @keyframes letterDrop {
          0% {
            opacity: 0;
            transform: translateY(-140px);
          }
          55% {
            opacity: 1;
            transform: translateY(0);
          }
          70% {
            transform: translateY(-22px);
          }
          85% {
            transform: translateY(0);
          }
          93% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0);
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
