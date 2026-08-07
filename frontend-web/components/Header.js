export default function Header({ cartCount = 0 }) {
  return (
    <header
      style={{
        background: "linear-gradient(180deg, var(--green-deep), var(--green-dark))",
        padding: "16px 0",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌟</span>
          <h1 style={{ color: "var(--white)", fontSize: 22 }}>Dan-Online</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--gold)",
            }}
            aria-label="Profil"
          />
          <div style={{ position: "relative" }}>
            <span style={{ color: "var(--white)", fontSize: 20 }}>🛒</span>
            {cartCount > 0 && (
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
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
