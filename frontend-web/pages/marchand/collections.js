import { useEffect, useState } from "react";
import MerchantLayout from "../../components/MerchantLayout";
import api from "../../lib/api";

export default function MerchantCollections() {
  const [collections, setCollections] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => {
    api.get("/collections/mine").then((r) => setCollections(r.data)).catch(() => setCollections([]));
    api.get("/shops/me").then((r) => {
      if (r.data) api.get(`/products?shop=${r.data._id}&limit=100`).then((res) => setProducts(res.data.products));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const createCollection = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/collections", { name: newName });
      setNewName("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  const toggleProduct = async (collection, productId) => {
    const has = collection.products.some((p) => p._id === productId);
    const newProducts = has
      ? collection.products.filter((p) => p._id !== productId).map((p) => p._id)
      : [...collection.products.map((p) => p._id), productId];

    setBusy(collection._id);
    try {
      await api.put(`/collections/${collection._id}`, { products: newProducts });
      load();
    } finally {
      setBusy(null);
    }
  };

  const removeCollection = async (id, name) => {
    if (!window.confirm(`Supprimer la collection "${name}" ?`)) return;
    setBusy(id);
    try {
      await api.delete(`/collections/${id}`);
      load();
    } finally {
      setBusy(null);
    }
  };

  if (collections === undefined) {
    return (
      <MerchantLayout title="Mes collections">
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Chargement...</p>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Mes collections">
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Mes collections</h1>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
        Organise tes produits en collections (ex: Nouveautés, Promo) visibles sur ta page boutique.
      </p>

      <form
        onSubmit={createCollection}
        style={{
          background: "var(--white)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          display: "flex",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <input
          required
          placeholder="Nom de la collection (ex: Nouveautés)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
        />
        <button className="btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
          Créer
        </button>
      </form>
      {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13, marginTop: -14, marginBottom: 14 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {collections.map((col) => (
          <div
            key={col._id}
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{col.name}</div>
              <button
                onClick={() => removeCollection(col._id, col.name)}
                disabled={busy === col._id}
                style={{ fontSize: 12, color: "var(--terracotta-dark)", fontWeight: 600 }}
              >
                Supprimer
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
              {col.products.length} produit{col.products.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {products.map((p) => {
                const checked = col.products.some((cp) => cp._id === p._id);
                return (
                  <label key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busy === col._id}
                      onChange={() => toggleProduct(col, p._id)}
                    />
                    {p.name}
                  </label>
                );
              })}
              {products.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Aucun produit disponible.</p>
              )}
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Aucune collection pour l'instant.</p>
        )}
      </div>
    </MerchantLayout>
  );
}
