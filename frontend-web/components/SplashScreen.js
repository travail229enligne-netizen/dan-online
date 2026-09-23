import { useEffect } from "react";

const PANDA_URL =
  "https://res.cloudinary.com/op1wrztj/image/upload/e_trim,e_replace_color:white:25:edede9/v1790159662/f8qmd314iffu0jlhpojl.png";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 5000);
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

      <style jsx>{`
        .splash {
          position: fixed;
          inset: 0;
          background: #ffffff;
          z-index: 9999;
          overflow: hidden;
          animation: fadeOut 0.6s ease 4.4s forwards;
        }
        .rig {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-260px, -50%);
          animation: rigMove 4.2s cubic-bezier(0.45, 0, 0.4, 1) 0.1s forwards;
        }
        .bounce {
          animation: walkBounce 0.4s ease-in-out infinite;
        }
        .panda-img {
          display: block;
          height: min(72vh, 520px);
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.15)) brightness(0);
          transform: scaleX(-1);
          -webkit-mask-image: radial-gradient(120% 120% at 50% 50%, black 88%, transparent 100%);
          mask-image: radial-gradient(120% 120% at 50% 50%, black 88%, transparent 100%);
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
