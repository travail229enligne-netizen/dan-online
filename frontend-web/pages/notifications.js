import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Notifications() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState(undefined);

  const load = () => {
    api.get("/notifications").then((r) => setNotifications(r.data.notifications)).catch(() => setNotifications([]));
  };

  useEffect(() => {
    if (!loading && user) load();
  }, [loading, user]);

  const handleClick = async (notif) => {
    if (!notif.read) {
      await api.put(`/notifications/${notif._id}/read`);
    }
    if (notif.link) window.location.href = notif.link;
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    load();
  };

  if (loading || (user && notifications === undefined)) return null;

  if (!user) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Connecte-toi pour voir tes notifications.</p>
        </main>
      </>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 20 }}>Notifications</h1>
          {hasUnread && (
            <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", textDecoration: "underline" }}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Aucune notification pour l'instant.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                style={{
                  textAlign: "left",
                  background: n.read ? "var(--white)" : "#f5f2ee",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                {!n.read && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--terracotta)", marginTop: 5, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
