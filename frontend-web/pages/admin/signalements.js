import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 16,
  boxSizing: "border-box",
};

const roleLabels = {
  client: "Client",
  marchand: "Marchand",
  admin: "Admin",
};

export default function AdminSignalements() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = () => {
    api.get("/reports").then((r) => setReports(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!loading && user?.role === "admin") load();
  }, [loading, user]);

  const markResolved = async (id) => {
    setBusy(id);
    try {
      await api.put(`/reports/${id}`, { status: "resolved" });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return null;

  if (!user || user.role !== "admin") {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Accès réservé aux administrateurs.</p>
        </main>
      </>
    );
  }

  const filtered = reports.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 16 }}>🚩 Signalements</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { value: "pending", label: "En attente" },
            { value: "resolved", label: "Traités" },
            { value: "all", label: "Tous" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${filter === f.value ? "var(--ink)" : "var(--line)"}`,
                background: filter === f.value ? "var(--ink)" : "var(--white)",
                color: filter === f.value ? "var(--white)" : "var(--ink)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => (
            <div key={r._id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.subject}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {r.author?.name} ({roleLabels[r.authorRole] || r.authorRole}) — {r.author?.phone}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
                    {new Date(r.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: r.status === "pending" ? "var(--terracotta)" : "var(--green-dark)",
                    color: "var(--white)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.status === "pending" ? "En attente" : "Traité"}
                </span>
              </div>
              <p style={{ fontSize: 13, marginTop: 10, marginBottom: r.status === "pending" ? 10 : 0, lineHeight: 1.6 }}>
                {r.message}
              </p>
              {r.status === "pending" && (
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                  disabled={busy === r._id}
                  onClick={() => markResolved(r._id)}
                >
                  Marquer comme traité
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucun signalement dans cette catégorie.</p>
          )}
        </div>
      </main>
    </>
  );
}
