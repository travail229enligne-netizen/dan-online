import { useEffect } from "react";

const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="stage">
        <div className="rig">
          <span className="panda">🐼</span>
          <span className="cart">🛒</span>
          <span className="shoe">👟</span>
        </div>
        <div className="letters">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="letter"
              style={{ animationDelay: `${1.2 + i * 0.28}s` }}
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
          animation: fadeOut 0.5s ease 3.3s forwards;
        }
        .stage {
          position: relative;
          width: 100%;
          height: 160px;
        }
        .rig {
          position: absolute;
          left: 50%;
          top: 30px;
          display: flex;
          align-items: flex-end;
          transform: translateX(-50%);
          animation: rigMove 3s ease-in-out forwards;
        }
        .panda {
          font-size: 44px;
          margin-right: -6px;
          transform: scaleX(-1);
        }
        .cart {
          font-size: 58px;
          position: relative;
        }
        .shoe {
          position: absolute;
          left: 68px;
          top: -60px;
          font-size: 34px;
          animation: fall 1s cubic-bezier(0.5, 0, 0.75, 0.9) forwards;
        }
        .letters {
          position: absolute;
          left: 50%;
          top: 96px;
          display: flex;
          gap: 3px;
          transform: translateX(-50%);
        }
        .letter {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--ink);
          opacity: 0;
          animation: letterAppear 0.01s linear forwards;
        }

        @keyframes rigMove {
          0%,
          40% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(calc(-50% + 120vw));
          }
        }
        @keyframes fall {
          0% {
            top: -60px;
            transform: rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          80% {
            top: -6px;
            transform: rotate(300deg);
          }
          100% {
            top: -10px;
            transform: rotate(320deg);
          }
        }
        @keyframes letterAppear {
          to {
            opacity: 1;
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
