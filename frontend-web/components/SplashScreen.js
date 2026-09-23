import { useEffect } from "react";

const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

function Panda() {
  return (
    <img
      src="https://res.cloudinary.com/op1wrztj/image/upload/v1790159662/f8qmd314iffu0jlhpojl.jpg"
      alt="Panda Shopyz"
      className="panda-svg"
      style={{ width: "90px", height: "150px", objectFit: "contain", display: "block", transform: "scaleX(-1)" }}
    />
  );
}

function Cart() {
  return (
    <svg width="96" height="84" viewBox="0 0 70 60" className="cart-svg">
      <polyline
        points="4,8 14,8 14,20"
        fill="none"
        stroke="#111"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14,20 L66,20 L58,46 L21,46 Z" fill="#111" />
      <line x1="31" y1="20" x2="29" y2="46" stroke="var(--cream)" strokeWidth="2.5" />
      <line x1="49" y1="20" x2="42" y2="46" stroke="var(--cream)" strokeWidth="2.5" />
      <line x1="18" y1="33" x2="61" y2="33" stroke="var(--cream)" strokeWidth="2.5" />
      <circle cx="29" cy="53" r="6" fill="#111" />
      <circle cx="51" cy="53" r="6" fill="#111" />
    </svg>
  );
}

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="stage">
        <div className="rig">
          <div className="panda-wrap">
            <Panda />
          </div>
          <div className="cart-wrap">
            <Cart />
            <span className="shoe">👟</span>
          </div>
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
          height: 320px;
        }
        .rig {
          position: absolute;
          left: 50%;
          top: 20px;
          display: flex;
          align-items: flex-end;
          transform: translateX(-50%);
          animation: rigMove 3s ease-in-out forwards;
        }
        .panda-wrap {
          margin-right: -10px;
          z-index: 2;
        }
        .cart-wrap {
          position: relative;
        }
        .shoe {
          position: absolute;
          left: 32px;
          top: -70px;
          font-size: 44px;
          animation: fall 1s cubic-bezier(0.5, 0, 0.75, 0.9) forwards;
        }
        .letters {
          position: absolute;
          left: 50%;
          top: 250px;
          display: flex;
          gap: 3px;
          transform: translateX(-50%);
        }
        .letter {
          font-family: var(--font-display);
          font-size: 48px;
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
            top: -70px;
            transform: rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          80% {
            top: -2px;
            transform: rotate(300deg);
          }
          100% {
            top: -6px;
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
