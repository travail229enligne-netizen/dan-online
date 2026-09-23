import { useEffect } from "react";

const LETTERS = ["S", "H", "O", "P", "Y", "Z"];

function Panda() {
  return (
    <img
      src="https://res.cloudinary.com/op1wrztj/image/upload/v1790159662/f8qmd314iffu0jlhpojl.jpg"
      alt="Panda Shopyz"
      className="panda-svg"
      style={{ width: "160px", height: "auto", objectFit: "contain", display: "block", transform: "scaleX(-1)" }}
    />
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
          <Panda />
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
          transform: translateX(-50%);
          animation: rigMove 3s ease-in-out forwards;
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
