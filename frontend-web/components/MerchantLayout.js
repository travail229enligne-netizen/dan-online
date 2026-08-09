import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";

const navItems = [
  { href: "/marchand/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/marchand/boutique", label: "Ma boutique", icon: "🏪" },
  { href: "/marchand/produits", label: "Produits", icon: "📦" },
  { href: "/marchand/portefeuille", label: "Portefeuille", icon: "💰" },
  { href: "/marchand/commandes", label: "Commandes", icon: "🧾" },
  { href: "/compte", label: "Mon compte", icon: "👤" },
];

export default function MerchantLayout({ children, title }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <header
        style={{
          background: "linear-gradient(180deg, var(--green-deep), var(--green-dark))",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            style={{ background: "transparent", color: "var(--white)", fontSize: 22, lineHeight: 1 }}
          >
            ☰
          </button>
          <span style={{ color: "var(--white)", fontWeight: 700, fontSize: 16 }}>
            {title || "Espace marchand"}
          </span>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--green-dark)",
          }}
        >
          {user?.name?.[0]?.toUpperCase() || "M"}
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
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--green-dark)" }}>
                🌟 EasyShop
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Espace marchand</div>
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
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--white)" : "var(--ink)",
                      background: active ? "var(--terracotta)" : "transparent",
                      marginBottom: 4,
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button
                onClick={logout}
                style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600 }}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        {children}
      </main>
    </div>
  );
}
