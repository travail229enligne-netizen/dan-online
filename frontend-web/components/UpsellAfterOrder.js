import { useState, useEffect } from "react";
import api from "../lib/api";

const idOf = (u) => (typeof u === "string" ? u : u?._id);
const unwrap = (r) => r.value.data.product || r.value.data;
const imgOf = (p) => (typeof p.images?.[0] === "string" ? p.images[0] : p.images?.[0]?.url || "");

export default function UpsellAfterOrder({ productIds }) {
  const [items, setItems] = useState([]);
  const key = (productIds || []).filter(Boolean).join(",");

  useEffect(() => {
    const ordered = key ? key.split(",") : [];
    if (ordered.length === 0) return;
    let alive = true;
    (async () => {
      try {
        const bases = await Promise.allSettled(ordered.map((id) => api.get(`/products/${id}`)));
        const ids = [];
        bases.forEach((r) => {
          if (r.status !== "fulfilled") return;
          (unwrap(r).upsellProducts || []).forEach((u) => {
            const id = idOf(u);
            if (id && !ordered.includes(id) && !ids.includes(id)) ids.push(id);
          });
        });
        const picks = await Promise.allSettled(ids.slice(0, 8).map((id) => api.get(`/products/${id}`)));
        const list = picks
          .filter((r) => r.status === "fulfilled")
          .map((r) => unwrap(r))
          .filter((p) => p && p._id && p.isActive !== false && !(typeof p.stock === "number" && p.stock <= 0))
          .slice(0, 4);
        if (alive) setItems(list);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  if (items.length === 0) return null;

  return (
    <section
      style={{
        marginTop: 20,
        background: "var(--white)",
        border: "2px solid var(--terracotta)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: "center", color: "var(--terracotta-dark)" }}>
        🔥 Ne t'arrête pas là !
      </h2>
      <p style={{ fontSize: 13, textAlign: "center", color: "var(--ink-soft)", margin: "6px 0 14px" }}>
        Ces produits vont parfaitement avec ta commande. Ajoute-les maintenant, avant de repartir.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map((p) => (
          <a
            key={p._id}
            href={`/produit/${p._id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
              textDecoration: "none",
              color: "var(--ink)",
              background: "var(--white)",
            }}
          >
            {imgOf(p) ? (
              <img src={imgOf(p)} alt="" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, background: "var(--cream)" }}>
                🛍️
              </div>
            )}
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--terracotta-dark)" }}>
                {Number(p.price).toLocaleString("fr-FR")} FCFA
              </div>
              {typeof p.stock === "number" && p.stock > 0 && p.stock <= 5 && (
                <div style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Plus que {p.stock} en stock</div>
              )}
              <div
                style={{
                  marginTop: "auto",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "7px 0",
                  borderRadius: 8,
                  background: "var(--terracotta)",
                  color: "var(--white)",
                }}
              >
                Je le veux
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
