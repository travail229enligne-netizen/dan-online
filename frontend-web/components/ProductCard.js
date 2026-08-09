import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function ProductCard({ product, onAddToCart, isFavorite: initialFav = false }) {
  const { user } = useAuth();
  const images = product.images && product.images.length > 0 ? product.images : [null];
  const [active, setActive] = useState(0);
  const [isFav, setIsFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setIsFav(initialFav);
  }, [initialFav]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/connexion";
      return;
    }
    setBusy(true);
    try {
      if (isFav) {
        await api.delete(`/favorites/${product._id}`);
        setIsFav(false);
        setFeedback("Retiré des favoris");
      } else {
        await api.post(`/favorites/${product._id}`);
        setIsFav(true);
        setFeedback("Ajouté aux favoris");
      }
      setTimeout(() => setFeedback(""), 1600);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <a href={`/produit/${product._id}`}>
        <div
          style={{
            height: 200,
            background: images[active] ? `#eee url(${images[active]}) center/cover no-repeat` : "#eee",
            transition: "background-image 0.3s ease",
            position: "relative",
          }}
        >
          {user?.role === "client" && (
            <button
              onClick={toggleFavorite}
              disabled={busy}
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                border: "none",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isFav ? "♥" : "♡"}
            </button>
          )}
          {feedback && (
            <div
              style={{
                position: "absolute",
                top: 46,
                right: 8,
                background: "rgba(17,17,17,0.85)",
                color: "var(--white)",
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 10px",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              {feedback}
            </div>
          )}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
              {images.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i === active ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </a>
      <div style={{ padding: 12 }}>
        <a href={`/produit/${product._id}`}>
          <div style={{ color: "var(--terracotta-dark)", fontWeight: 700 }}>
            {product.price?.toLocaleString("fr-FR")} FCFA
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{product.name}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 12, marginBottom: 10 }}>
            {product.shop?.name}
          </div>
        </a>
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => onAddToCart?.(product)}>
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
