import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const ctx = useTheme();
  if (!ctx) return null;
  const { theme, toggleTheme } = ctx;
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Passer au theme clair" : "Passer au theme sombre"}
      style={{
        background: "var(--cream)",
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        fontWeight: 600,
        textAlign: "left",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
    >
      <span className="theme-icon-stage">
        <svg key={`sun-${theme}`} className={`theme-icon ${isDark ? "hide" : "show"}`} viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
            <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
            <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
            <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
          </g>
        </svg>
        <svg key={`moon-${theme}`} className={`theme-icon ${isDark ? "show" : "hide"}`} viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M20.2 14.7A8.6 8.6 0 1 1 9.3 3.8a7 7 0 1 0 10.9 10.9z" />
        </svg>
      </span>
      {isDark ? "Thème sombre activé" : "Activer le thème sombre"}

      <style jsx>{`
        .theme-icon-stage {
          position: relative;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          color: var(--ink);
        }
        .theme-icon {
          position: absolute;
          top: 0;
          left: 0;
        }
        .theme-icon.show {
          animation: iconIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .theme-icon.hide {
          animation: iconOut 0.3s ease forwards;
        }
        @keyframes iconIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-90deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes iconOut {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(90deg);
          }
        }
      `}</style>
    </button>
  );
}
