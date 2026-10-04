import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/Header";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const CLOUD_NAME = "op1wrztj";
const UPLOAD_PRESET = "dan-online";

export default function CommandeLivreur() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [order, setOrder] = useState(undefined);
  const [responding, setResponding] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const proofFileRef = useRef(null);
  const paymentProofFileRef = useRef(null);

  const load = () => {
    if (!id) return;
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => setOrder(null));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [id]);

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleRespond = async (available) => {
    setResponding(true);
    try {
      await api.put(`/orders/${id}/courier-response`, { available });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'enregistrer ta reponse.");
    } finally {
      setResponding(false);
    }
  };

  const handleProofPick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const url = await uploadToCloudinary(file, "image");
      await api.put(`/orders/${id}/delivery-proof`, { imageUrl: url });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'envoyer la preuve.");
    } finally {
      setUploadingProof(false);
      if (proofFileRef.current) proofFileRef.current.value = "";
    }
  };

  const handlePaymentProofPick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPaymentProof(true);
    try {
      const url = await uploadToCloudinary(file, "image");
      await api.put(`/orders/${id}/payment-proof`, { imageUrl: url });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'envoyer la preuve de paiement.");
    } finally {
      setUploadingPaymentProof(false);
      if (paymentProofFileRef.current) paymentProofFileRef.current.value = "";
    }
  };

  if (!loading && !user) {
    if (typeof window !== "undefined") router.push(`/connexion?next=/livreur/commande/${id}`);
    return null;
  }

  if (order === undefined) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Commande introuvable.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 440 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>📦 Commande à livrer</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
          Commande #{order._id.slice(-6).toUpperCase()}
        </p>

        <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16, boxSizing: "border-box" }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span>{it.quantity}× {it.name}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            <span>Total</span>
            <span style={{ color: "var(--terracotta-dark)" }}>{(order.grandTotal || 0).toLocaleString("fr-FR")} FCFA</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            <div>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</div>
            <div>📞 {order.deliveryPhone}</div>
            <div style={{ fontWeight: 600, marginTop: 4, color: order.paymentMethod === "kkiapay" && order.paymentStatus === "paid" ? "var(--green-dark)" : "var(--terracotta-dark)" }}>
              {order.paymentMethod === "kkiapay"
                ? order.paymentStatus === "paid"
                  ? "💳 Réglée en ligne"
                  : "💳 Le client réglera en ligne après la livraison"
                : `💵 À encaisser : ${(order.grandTotal || 0).toLocaleString("fr-FR")} FCFA`}
            </div>
          </div>
        </div>

        {order.courierStatus === "pending" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn-primary" onClick={() => handleRespond(true)} disabled={responding} style={{ flex: 1, fontSize: 14, padding: 12 }}>
              {responding ? "..." : "✅ Disponible"}
            </button>
            <button onClick={() => handleRespond(false)} disabled={responding} style={{ flex: 1, fontSize: 14, padding: 12, borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", color: "var(--terracotta-dark)", fontWeight: 600 }}>
              ❌ Pas disponible
            </button>
          </div>
        )}

        {order.courierStatus === "unavailable" && (
          <p style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600, marginBottom: 16 }}>
            Tu as indiqué ne pas être disponible pour cette commande.
          </p>
        )}

        {order.courierStatus === "available" && !order.deliveryProofUrl && (
          <>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
              Prends une photo montrant le colis remis au client.
            </p>
            <input ref={proofFileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleProofPick} />
            <button className="btn-primary" onClick={() => proofFileRef.current?.click()} disabled={uploadingProof} style={{ width: "100%", fontSize: 14, padding: 12, marginBottom: 16 }}>
              {uploadingProof ? "Envoi de la preuve..." : "🏁 Terminer la course"}
            </button>
          </>
        )}

        {order.deliveryProofUrl && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 16 }}>
            <div style={{ padding: "6px 10px", background: "#e8f5ee", fontSize: 12, fontWeight: 700, color: "var(--green-dark)" }}>
              ✅ Preuve de livraison envoyée
            </div>
            <img src={order.deliveryProofUrl} alt="Preuve de livraison" style={{ width: "100%", display: "block" }} />
          </div>
        )}

        {order.deliveryProofUrl && order.paymentMethod === "cod" && order.paymentStatus !== "paid" && (
          <>
            <input ref={paymentProofFileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePaymentProofPick} />
            <button className="btn-primary" onClick={() => paymentProofFileRef.current?.click()} disabled={uploadingPaymentProof} style={{ width: "100%", fontSize: 14, padding: 12 }}>
              {uploadingPaymentProof ? "Envoi de la preuve..." : "📸 Preuve du paiement"}
            </button>
          </>
        )}

        {order.paymentProofUrl && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", marginTop: 16 }}>
            <div style={{ padding: "6px 10px", background: "#e8f5ee", fontSize: 12, fontWeight: 700, color: "var(--green-dark)" }}>
              ✅ Preuve de paiement en espèces
            </div>
            <img src={order.paymentProofUrl} alt="Preuve de paiement" style={{ width: "100%", display: "block" }} />
          </div>
        )}
      </main>
    </>
  );
}
