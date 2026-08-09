import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/#boutiques", label: "Boutiques" },
  { href: "/#categories", label: "Catégories" },
  { href: "/commande", label: "Commandes" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        style={{
          background: "linear-gradient(180deg, var(--green-deep), var(--green-dark))",
          padding: "16px 0",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              style={{ background: "transparent", color: "var(--white)", fontSize: 22, lineHeight: 1 }}
            >
              ☰
            </button>
            <a href="/" style={{ display: "flex", alignItems: "center" }}>
              <h1 style={{ color: "var(--white)", fontSize: 22 }}>EasyShop</h1>
            </a>
          </div>
          <a href="/panier" style={{ color: "var(--white)", position: "relative" }}>
            <span style={{ fontSize: 20 }}>🛒</span>
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
      </header>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 30,
          }}
        >
          <nav
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 250,
              height: "100%",
              background: "var(--white)",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "0 20px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>
                EasyShop
              </div>
            </div>

            <div style={{ padding: "12px 8px", flex: 1 }}>
              {navItems.map((item) => {
                const active = router.pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--white)" : "var(--ink)",
                      background: active ? "var(--ink)" : "transparent",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </a>
                );
              })}

              <a
                href={user ? "/compte" : "/connexion"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 4,
                }}
              >
                {user ? "Mon compte" : "Connexion"}
              </a>
            </div>

            {user && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <button
                  onClick={logout}
                  style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600 }}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
