import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

export default function Header() {
  const { user } = useAuth();
  const { count } = useCart();

  return (
    <header
      style={{
        background: "linear-gradient(180deg, var(--green-deep), var(--green-dark))",
        padding: "16px 0",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ color: "var(--white)", fontSize: 22 }}>EasyShop</h1>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href={user ? "/compte" : "/connexion"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--green-dark)",
              fontWeight: 700,
              fontSize: 14,
            }}
            aria-label="Profil"
          >
            {user ? user.name?.[0]?.toUpperCase() : "?"}
          </a>
          <a href="/panier" style={{ position: "relative" }}>
            <span style={{ color: "var(--white)", fontSize: 20 }}>🛒</span>
            {count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "var(--terracotta)",
                  color: "var(--white)",
                  borderRadius: "50%",
                  fontSize: 11,
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {count}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
