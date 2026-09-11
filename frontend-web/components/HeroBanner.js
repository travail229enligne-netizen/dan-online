import { useEffect, useState } from "react";
import api from "../lib/api";

const orderedTypes = ["boutique", "restaurant", "supermarche", "grossiste", "artisan"];
const HERO_HEIGHT = 300;

export default function HeroBanner({ title, subtitle, ctaLabel = "Commander maintenant", onCtaClick }) {
  const [images, setImages] = useState([]);
  const [phase, setPhase] = useState("intro"); // intro | carousel | final
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    api
      .get("/hero-images")
      .then((r) => {
        const sorted = orderedTypes
          .flatMap((type) => r.data.filter((img) => img.businessType === type))
          .filter(Boolean);
        setImages(sorted);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    if (phase === "intro") {
      const t = setTimeout(() => setPhase("carousel"), 3000);
      return () => clearTimeout(t);
    }

    if (phase === "carousel") {
      if (imageIndex >= images.length) {
        setPhase("final");
        return;
      }
      const t = setTimeout(() => setImageIndex((i) => i + 1), 1800);
      return () => clearTimeout(t);
    }

    if (phase === "final") {
      const t = setTimeout(() => {
        setImageIndex(0);
        setPhase("intro");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, imageIndex, images.length]);

  const currentImage = phase === "carousel" ? images[imageIndex] : null;

  return (
    <div
      style={{
        position: "relative",
        height: HERO_HEIGHT,
        background: currentImage
          ? `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${currentImage.imageUrl})`
          : "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "var(--radius-lg)",
        padding: "24px 20px",
        color: "var(--white)",
        marginTop: 16,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        transition: "background 0.6s ease",
        overflow: "hidden",
      }}
    >
      {phase === "intro" && (
        <p
          key="intro"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            lineHeight: 1.35,
            maxWidth: 460,
            margin: 0,
            animation: "heroFade 0.8s ease",
          }}
        >
          {subtitle?.split(".")[0] || "Découvrez une nouvelle façon de faire vos achats et de vendre en ligne."}
          {!subtitle && "."}
        </p>
      )}

      {phase === "carousel" && currentImage && (
        <div
          key={currentImage._id}
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            background: "rgba(0,0,0,0.4)",
            padding: "8px 16px",
            borderRadius: 999,
            animation: "heroFade 0.5s ease",
          }}
        >
          {currentImage.businessType}
        </div>
      )}

      {(phase === "final" || images.length === 0) && (
        <div
          key="final"
          style={{
            animation: "heroFade 0.8s ease",
            maxHeight: "100%",
            overflowY: "auto",
            width: "100%",
            padding: "0 4px",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--white)", fontSize: 21, lineHeight: 1.25, marginBottom: 10, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#EDE7DA", maxWidth: 480, lineHeight: 1.45, marginLeft: "auto", marginRight: "auto" }}>
              {subtitle}
            </p>
          )}
          {onCtaClick && (
            <button className="btn-primary" onClick={onCtaClick}>
              {ctaLabel}
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes heroFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
