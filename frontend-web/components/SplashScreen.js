import { useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2300);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash">
      <div className="scene">
        <span className="shoe">👟</span>
        <span className="cart">🛒</span>
      </div>
      <div className="brand">Shopyz</div>

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeOut 0.5s ease 2s forwards;
        }
        .scene {
          position: relative;
          width: 120px;
          height: 140px;
        }
        .shoe {
          position: absolute;
          left: 50%;
          top: 0;
          font-size: 42px;
          transform: translateX(-50%);
          animation: fall 1.2s cubic-bezier(0.5, 0, 0.75, 0.9) forwards;
        }
        .cart {
          position: absolute;
          left: 50%;
          bottom: 4px;
          font-size: 64px;
          transform: translateX(-50%);
          animation: bounce 0.35s ease 1.2s;
        }
        .brand {
          margin-top: 22px;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--ink);
          opacity: 0;
          animation: appear 0.4s ease 1.4s forwards;
        }

        @keyframes fall {
          0% {
            top: 0;
            transform: translateX(-50%) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          70% {
            top: 68px;
            transform: translateX(-50%) rotate(300deg);
          }
          85% {
            top: 52px;
          }
          100% {
            top: 68px;
            transform: translateX(-50%) rotate(340deg);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0% {
            transform: translateX(-50%) scale(1);
          }
          40% {
            transform: translateX(-50%) scale(1.15);
          }
          100% {
            transform: translateX(-50%) scale(1);
          }
        }
        @keyframes appear {
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
