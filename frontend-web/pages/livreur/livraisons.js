import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

export default function LivraisonsDisponibles() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");

  const load = () => {
    api
      .get("/shopyz-delivery/available")
      .then((r) => {
        setOrders(r.data);
        setForbidden(false);
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
        else setOrders((o) => o || []);
      });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/connexion?next=${encodeURIComponent("/livreur/livraisons")}`);
    }
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [loading, user]);

  const claim = async (id) => {
    setBusy(id);
    setMessage("");
    try {
      const { data } = await api.post(`/shopyz-delivery/${id}/claim`);
      router.push(data.conversationId ? `/messages/c/${data.conversationId}` : "/messages");
    } catch (err) {
      setMessage(err.response?.data?.message || "Impossible de prendre cette livraison.");
      load();
    } finally {
      setBusy(null);
    }
  };

  const decline = async (id) => {
    setBusy(id);
    setMessage("");
    try {
      await api.post(`/shopyz-delivery/${id}/decline`);
    } finally {
      setBusy(null);
      load();
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 480, paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Livraisons disponibles</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
          Le premier livreur qui se déclare disponible prend la livraison.
        </p>

        {message && <p style={{ color: "var(--terracotta-dark)", fontSize: 13, marginBottom: 12 }}>{message}</p>}

        {forbidden ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Cette page est réservée aux livreurs Shopyz.</p>
        ) : orders === null ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o._id} style={card}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>📦 Commande #{o._id.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>🏪 {o.shopyzDelegatedBy?.name || "Boutique"}</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  {o.items.map((it, i) => (
                    <div key={i}>{it.quantity}× {it.name}</div>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>Total : {o.grandTotal.toLocaleString("fr-FR")} FCFA</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
                  📍 {o.deliveryCity || "Ville non précisée"}. L'adresse complète s'affiche après ta réponse « Disponible ».
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={() => claim(o._id)} disabled={busy === o._id} style={{ flex: 1, fontSize: 13, padding: 10 }}>
                    {busy === o._id ? "..." : "✅ Disponible"}
                  </button>
                  <button
                    onClick={() => decline(o._id)}
                    disabled={busy === o._id}
                    style={{ flex: 1, fontSize: 13, padding: 10, borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", color: "var(--terracotta-dark)", fontWeight: 600 }}
                  >
                    ❌ Pas disponible
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune livraison disponible pour le moment.</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
