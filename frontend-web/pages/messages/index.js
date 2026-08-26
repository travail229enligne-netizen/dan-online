import { useEffect, useState } from "react";
import Header from "../../components/Header";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function Messages() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState(undefined);

  useEffect(() => {
    if (!loading && user) {
      api.get("/messages/conversations").then((r) => setConversations(r.data)).catch(() => setConversations([]));
    }
  }, [loading, user]);

  if (loading || (user && conversations === undefined)) return null;

  if (!user) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Connecte-toi pour voir tes messages.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Messages</h1>

        {conversations.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Aucune conversation pour l'instant.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {conversations.map((conv) => {
              const unread = user.role === "client" ? conv.unreadForClient : conv.unreadForMerchant;
              const title = user.role === "client" ? conv.shop?.name : conv.client?.name;
              return (
                <a
                  key={conv._id}
                  href={`/messages/c/${conv._id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--white)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{title || "Conversation"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                      {conv.lastMessage || "Aucun message"}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span
                      style={{
                        background: "var(--terracotta)",
                        color: "var(--white)",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {unread}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
