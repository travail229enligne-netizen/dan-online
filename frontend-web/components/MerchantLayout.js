import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

const navItems = [
  { href: "/marchand/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/marchand/boutique", label: "Ma boutique", icon: "🏪" },
  { href: "/marchand/produits", label: "Produits", icon: "📦" },
  { href: "/marchand/import", label: "Import CSV", icon: "📥" },
  { href: "/marchand/portefeuille", label: "Portefeuille", icon: "💰" },
  { href: "/marchand/collections", label: "Collections", icon: "🗂️" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/marchand/commandes", label: "Commandes", icon: "🧾" },
  { href: "/compte", label: "Mon compte", icon: "👤" },
];

export default function MerchantLayout({ children, title }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadOrders, setUnreadOrders] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      api
        .get("/notifications")
        .then((r) => {
          setUnreadNotif(r.data.unreadCount);
          setUnreadOrders(r.data.unreadOrders || 0);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/notifications" aria-label="Notifications" style={{ color: "var(--white)", position: "relative" }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            {unreadNotif > 0 && (
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
                {unreadNotif > 9 ? "9+" : unreadNotif}
              </span>
            )}
          </a>
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
                const showDot = item.href === "/marchand/commandes" && unreadOrders > 0;
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
                    {showDot && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: active ? "var(--white)" : "var(--terracotta)",
                          marginLeft: "auto",
                        }}
                      />
                    )}
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
