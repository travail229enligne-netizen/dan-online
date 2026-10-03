export default function PushPrompt({ onConfirm }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 340,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔔</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Recevoir les notifications</h2>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 22, lineHeight: 1.5 }}>
          Reste informé en temps réel de tes commandes, messages et mises à jour importantes sur Shopyz.
        </p>
        <button
          className="btn-primary"
          style={{ width: "100%", padding: 14, fontSize: 15 }}
          onClick={onConfirm}
        >
          OK
        </button>
      </div>
    </div>
  );
}
