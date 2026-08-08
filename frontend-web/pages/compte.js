import Header from "../components/Header";
import { useAuth } from "../lib/auth";

export default function Compte() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>
            <a href="/connexion" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Connecte-toi</a> pour accéder à ton compte.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: 420, paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Mon compte</h1>

        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 2 }}>{user.email}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{user.phone}</div>
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "3px 10px",
              borderRadius: 20,
              background: "var(--cream)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--green-deep)",
            }}
          >
            {user.role === "marchand" ? "Marchand" : user.role === "admin" ? "Administrateur" : "Client"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <a
            href="/commandes"
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            📦 Mes commandes
          </a>
          {user.role === "marchand" && (
            <a
              href="/marchand/dashboard"
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              🏪 Tableau de bord marchand
            </a>
          )}
          <button
            onClick={logout}
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              fontWeight: 600,
              fontSize: 14,
              color: "var(--terracotta-dark)",
              textAlign: "left",
            }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}
