import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadOrders, setUnreadOrders] = useState(0);

  useEffect(() => {
    if (open && categories.length === 0) {
      api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    }
  }, [open]);

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

  const navLink = (href, label, showDot) => (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: router.pathname === href ? 700 : 500,
        color: router.pathname === href ? "var(--white)" : "var(--ink)",
        background: router.pathname === href ? "var(--ink)" : "transparent",
        marginBottom: 4,
      }}
    >
      {label}
      {showDot && (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "red",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          !
        </span>
      )}
    </a>
  );

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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/recherche" aria-label="Rechercher" style={{ color: "var(--white)", fontSize: 20 }}>
              🔍
            </a>
            {user && (
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
            )}
            <button
              onClick={() => setProfileOpen(true)}
              aria-label="Mon profil"
              style={{ background: "transparent", color: "var(--white)" }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 20 }}>👤</span>
              )}
            </button>
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
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "0 20px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>
                EasyShop
              </div>
            </div>

            <div style={{ padding: "12px 8px", flex: 1 }}>
              {navLink("/", "Accueil")}

              <a
                href="/#boutiques"
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
                Boutiques
              </a>

              <button
                onClick={() => setCatOpen(!catOpen)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 4,
                }}
              >
                <span>Catégories</span>
                <span style={{ fontSize: 11 }}>{catOpen ? "▲" : "▼"}</span>
              </button>

              {catOpen && (
                <div style={{ paddingLeft: 12, marginBottom: 4 }}>
                  {categories.map((cat) => (
                    <a
                      key={cat._id}
                      href={`/categorie/${cat.slug}`}
                      style={{
                        display: "block",
                        padding: "9px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "var(--ink-soft)",
                      }}
                    >
                      {cat.name}
                    </a>
                  ))}
                  {categories.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", padding: "6px 14px" }}>Chargement...</p>
                  )}
                </div>
              )}

              {navLink("/panier", "Panier")}
              {navLink("/commandes", "Commandes", unreadOrders > 0)}
              {navLink("/favoris", "Favoris")}
              {navLink("/favoris-boutiques", "Boutiques suivies")}
              {navLink("/messages", "Messages")}

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

      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 30,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 260,
              height: "100%",
              background: "var(--white)",
              padding: "20px 16px",
              overflowY: "auto",
            }}
          >
            {!user ? (
              <div style={{ textAlign: "center", paddingTop: 30 }}>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
                  Connecte-toi pour accéder à ton compte.
                </p>
                <a href="/connexion" className="btn-primary" style={{ display: "inline-block" }}>
                  Se connecter
                </a>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                      {user.role === "marchand" ? "Marchand" : user.role === "admin" ? "Administrateur" : "Client"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="/compte" style={{ background: "var(--cream)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600 }}>
                    Voir mon profil
                  </a>
                  <a href="/commandes" style={{ background: "var(--cream)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600 }}>
                    Mes commandes
                  </a>
                  {user.role === "marchand" && (
                    <a href="/marchand/dashboard" style={{ background: "var(--cream)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600 }}>
                      Tableau de bord marchand
                    </a>
                  )}
                  {user.role === "admin" && (
                    <a href="/admin/dashboard" style={{ background: "var(--cream)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600 }}>
                      Espace administrateur
                    </a>
                  )}
                  <button
                    onClick={logout}
                    style={{ background: "var(--cream)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: "var(--terracotta-dark)", textAlign: "left" }}
                  >
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
