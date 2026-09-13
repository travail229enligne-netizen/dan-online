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

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {fair.bannerImage && (
                  <img src={fair.bannerImage} alt={fair.title} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{fair.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
                    {new Date(fair.startDate).toLocaleDateString("fr-FR")} → {new Date(fair.endDate).toLocaleDateString("fr-FR")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {accepted.length} boutique{accepted.length > 1 ? "s" : ""} participante{accepted.length > 1 ? "s" : ""}
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
