import { useEffect, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

export default function Favoris() {
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setFavorites(null);
      return;
    }
    api.get("/favorites").then((r) => setFavorites(r.data)).catch(() => setFavorites([]));
  }, [loading, user]);

  if (loading || favorites === undefined) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
            Connecte-toi pour voir tes favoris.
          </p>
          <a href="/connexion" className="btn-primary" style={{ display: "inline-block" }}>
            Se connecter
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Mes favoris</h1>

        {favorites.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Tu n'as pas encore de favoris. Explore les produits et appuie sur ♡ pour les sauvegarder ici.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {favorites.map((p) => (
              <ProductCard key={p._id} product={p} isFavorite onAddToCart={(prod) => addToCart(prod, 1)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
