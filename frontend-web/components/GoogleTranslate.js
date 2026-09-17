import { useEffect, useState, useRef } from "react";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

function getCookieLang() {
  const match = document.cookie.match(/googtrans=\/fr\/(\w+)/);
  return match ? match[1] : "fr";
}

function setLanguage(code) {
  const hostname = window.location.hostname;

  if (code === "fr") {
    document.cookie = "googtrans=/fr/fr; path=/";
    document.cookie = `googtrans=/fr/fr; path=/; domain=${hostname}`;
  } else {
    document.cookie = `googtrans=/fr/${code}; path=/`;
    document.cookie = `googtrans=/fr/${code}; path=/; domain=${hostname}`;
  }

  window.location.reload();
}

export default function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("fr");
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrent(getCookieLang());

    if (window.googleTranslateElementInit) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "fr",
          includedLanguages: LANGUAGES.map((l) => l.code).filter((c) => c !== "fr").join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Widget Google réel, caché — nécessaire pour que la traduction fonctionne */}
      <div id="google_translate_element" style={{ display: "none" }} />

      <button
        onClick={() => setOpen(!open)}
        aria-label="Choisir la langue"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--cream)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "6px 10px",
          fontSize: 16,
        }}
      >
        <span>{currentLang.flag}</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            overflow: "hidden",
            zIndex: 50,
            minWidth: 160,
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: lang.code === current ? 700 : 500,
                color: "var(--ink)",
                background: lang.code === current ? "var(--cream)" : "transparent",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
