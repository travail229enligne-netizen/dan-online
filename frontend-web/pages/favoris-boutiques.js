import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

export default function BoutiquesSuivies() {
  const { user, loading } = useAuth();
  const [shops, setShops] = useState(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShops(null);
      return;
    }
    api.get("/follows").then((r) => setShops(r.data)).catch(() => setShops([]));
  }, [loading, user]);

  if (loading || shops === undefined) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
            Connecte-toi pour voir tes boutiques suivies.
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
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Boutiques suivies</h1>

        {shops.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Tu ne suis encore aucune boutique. Va sur une page boutique et appuie sur "Suivre" pour être notifié de ses nouveautés.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shops.map((shop) => (
              <a
                key={shop._id}
                href={`/boutique/${shop.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--white)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: 12,
                }}
              >
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {shop.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{shop.city}</div>
                  {shop.isVerified && <span style={{ fontSize: 11, color: "var(--ink)" }}>✓ Vérifié</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
