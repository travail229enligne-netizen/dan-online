import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import ImageUpload from "../../components/ImageUpload";
import api from "../../lib/api";

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 18,
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid var(--line)",
  borderRadius: 14,
  fontSize: 15,
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 13, fontWeight: 600, display: "flex", flexDirection: "column", gap: 2 };

const statusLabels = {
  pending: { text: "En attente", color: "var(--ink-soft)" },
  accepted: { text: "Participe", color: "var(--green-dark)" },
  declined: { text: "Refusé", color: "var(--terracotta-dark)" },
};

function FairCard({ fair, myShopId, myProducts, onRespond, onUpdateEntries, onInvite, busy }) {
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(
    fair.entries.filter((e) => e.shop?._id === myShopId).map((e) => e.product?._id)
  );

  const isOrganizer = fair.organizerShop?._id === myShopId;
  const myParticipation = fair.participants.find((p) => p.shop?._id === myShopId);

  const searchShops = async (q) => {
    setInviteQuery(q);
    if (!q.trim()) return setInviteResults([]);
    const { data } = await api.get(`/shops?search=${encodeURIComponent(q)}`);
    setInviteResults(data.filter((s) => s._id !== myShopId));
  };

  const toggleProduct = (id) => {
    setSelectedProducts((sel) => (sel.includes(id) ? sel.filter((p) => p !== id) : [...sel, id]));
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fair.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {new Date(fair.startDate).toLocaleDateString("fr-FR")} → {new Date(fair.endDate).toLocaleDateString("fr-FR")}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Organisée par {fair.organizerShop?.name}</div>
        </div>
        {myParticipation && (
          <span style={{ fontSize: 11, fontWeight: 700, color: statusLabels[myParticipation.status].color, whiteSpace: "nowrap" }}>
            {statusLabels[myParticipation.status].text}
          </span>
        )}
      </div>

      {myParticipation?.status === "pending" && !isOrganizer && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => onRespond(fair._id, true)}
            style={{ flex: 1, fontSize: 12, padding: "8px 14px" }}
          >
            Accepter
          </button>
          <button
            disabled={busy}
            onClick={() => onRespond(fair._id, false)}
            style={{ flex: 1, fontSize: 12, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", color: "var(--terracotta-dark)", background: "var(--white)", fontWeight: 600 }}
          >
            Refuser
          </button>
        </div>
      )}

      {myParticipation?.status === "accepted" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Mes produits dans cette Foire</div>
          <div style={{ background: "var(--cream)", borderRadius: 10, padding: 8, maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
            {myProducts.map((p) => (
              <label key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 2px" }}>
                <input type="checkbox" checked={selectedProducts.includes(p._id)} onChange={() => toggleProduct(p._id)} />
                {p.name}
              </label>
            ))}
            {myProducts.length === 0 && <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>Aucun produit.</p>}
          </div>
          <button
            onClick={() => onUpdateEntries(fair._id, selectedProducts)}
            style={{ fontSize: 12, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600 }}
          >
            Enregistrer ma sélection
          </button>
        </div>
      )}

      {fair.participants.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginBottom: isOrganizer ? 10 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Boutiques participantes</div>
          {fair.participants.map((p) => (
            <div key={p.shop?._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span>{p.shop?.name}</span>
              <span style={{ color: statusLabels[p.status].color, fontWeight: 600 }}>{statusLabels[p.status].text}</span>
            </div>
          ))}
        </div>
      )}

      {isOrganizer && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Inviter une boutique</div>
          <input
            placeholder="Rechercher par nom..."
            value={inviteQuery}
            onChange={(e) => searchShops(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 13, border: "1px solid var(--line)", borderRadius: 10, boxSizing: "border-box", marginBottom: 6 }}
          />
          {inviteResults.map((s) => (
            <div key={s._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0" }}>
              <span>{s.name}</span>
              <button
                onClick={() => {
                  onInvite(fair._id, s._id);
                  setInviteQuery("");
                  setInviteResults([]);
                }}
                style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--white)", fontWeight: 600 }}
              >
                Inviter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Foires() {
  const [myShopId, setMyShopId] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [fairs, setFairs] = useState(undefined);
  const [form, setForm] = useState({ title: "", description: "", bannerImage: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get("/fairs/me");
    setFairs(data);
  };

  useEffect(() => {
    api.get("/shops/me").then((r) => {
      setMyShopId(r.data._id);
      api.get(`/products?shop=${r.data._id}`).then((res) => setMyProducts(res.data.products));
    });
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/fairs", form);
      setForm({ title: "", description: "", bannerImage: "", startDate: "", endDate: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer la Foire.");
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (fairId, accept) => {
    setBusy(true);
    try {
      await api.put(`/fairs/${fairId}/respond`, { accept });
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateEntries = async (fairId, productIds) => {
    setBusy(true);
    try {
      await api.put(`/fairs/${fairId}/products`, { productIds });
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (fairId, shopId) => {
    setBusy(true);
    try {
      await api.post(`/fairs/${fairId}/invite`, { shopId });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'inviter cette boutique.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MerchantLayout title="Foires">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>Foires</h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
        Organise une Foire avec d'autres boutiques, ou rejoins celle à laquelle tu es invité.
      </p>

      <form onSubmit={handleCreate} style={{ ...card, display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Organiser une nouvelle Foire</div>

        <ImageUpload label="Bannière de la Foire" value={form.bannerImage} onChange={(url) => setForm({ ...form, bannerImage: url })} />

        <label style={labelStyle}>
          Titre
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Début
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ ...labelStyle, flex: "1 1 140px" }}>
            Fin
            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
          </label>
        </div>

        {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 14, margin: 0 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15, padding: 14, borderRadius: 14 }}>
          {saving ? "Création..." : "Créer la Foire"}
        </button>
      </form>

      <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
        Mes Foires {fairs && `(${fairs.length})`}
      </h2>

      {fairs === undefined && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>}
      {fairs && fairs.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune Foire pour l'instant.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fairs?.map((fair) => (
          <FairCard
            key={fair._id}
            fair={fair}
            myShopId={myShopId}
            myProducts={myProducts}
            onRespond={handleRespond}
            onUpdateEntries={handleUpdateEntries}
            onInvite={handleInvite}
            busy={busy}
          />
        ))}
      </div>
    </MerchantLayout>
  );
}
