import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";

export default function Foires() {
  const [fairs, setFairs] = useState(undefined);

  useEffect(() => {
    api.get("/fairs").then((r) => setFairs(r.data)).catch(() => setFairs([]));
  }, []);

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>Foires</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Événements organisés par plusieurs boutiques partenaires, le temps d'une période.
        </p>

        {fairs === undefined && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}
        {fairs && fairs.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune Foire active pour l'instant.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {fairs?.map((fair) => {
            const accepted = fair.participants.filter((p) => p.status === "accepted");
            return (
              <a
                key={fair._id}
                href={`/foire/${fair._id}`}
                style={{
                  display: "block",
                  background: "var(--white)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                {fair.bannerImage ? (
                  <div style={{ width: "100%", aspectRatio: "16 / 7", overflow: "hidden", background: "var(--ink)" }}>
                    <img
                      src={fair.bannerImage}
                      alt={fair.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 7",
                      background: "linear-gradient(135deg, var(--green-deep), var(--green-dark))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--white)",
                      fontFamily: "var(--font-display)",
                      fontSize: 20,
                    }}
                  >
                    {fair.title}
                  </div>
                )}
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{fair.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
                    <span>📅</span>
                    <span>{new Date(fair.startDate).toLocaleDateString("fr-FR")} → {new Date(fair.endDate).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                    <span>🏪</span>
                    <span>{accepted.length} boutique{accepted.length > 1 ? "s" : ""} participante{accepted.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}
