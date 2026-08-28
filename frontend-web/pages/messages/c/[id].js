import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/Header";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const CLOUD_NAME = "op1wrztj";
const UPLOAD_PRESET = "dan-online";

function whatsappBase(phone) {
  if (!phone) return null;
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

function OrderSummaryCard({ order, isCourier, onRespond, onSubmitProof, responding, uploadingProof }) {
  if (!order) return null;

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        overflow: "hidden",
        maxWidth: "90%",
        alignSelf: "flex-start",
      }}
    >
      <div style={{ padding: "10px 14px", background: "var(--cream)", borderBottom: "1px solid var(--line)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>
          📦 Commande à livrer
        </span>
      </div>
      <div style={{ padding: 14, fontSize: 13 }}>
        {order.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{it.quantity}× {it.name}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
          Total : <span style={{ color: "var(--terracotta-dark)" }}>{order.grandTotal.toLocaleString("fr-FR")} FCFA</span>
        </div>
        <div style={{ marginTop: 8, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          <div>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</div>
          <div>📞 {order.deliveryPhone}</div>
          <div style={{ fontWeight: 600, color: order.paymentMethod === "kkiapay" ? "var(--green-dark)" : "var(--terracotta-dark)" }}>
            {order.paymentMethod === "kkiapay" ? "💳 Déjà réglée en ligne" : `💵 À encaisser : ${order.grandTotal.toLocaleString("fr-FR")} FCFA`}
          </div>
        </div>

        {isCourier && order.courierStatus === "pending" && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn-primary"
              onClick={() => onRespond(true)}
              disabled={responding}
              style={{ flex: 1, fontSize: 13, padding: 10 }}
            >
              {responding ? "..." : "✅ Disponible"}
            </button>
            <button
              onClick={() => onRespond(false)}
              disabled={responding}
              style={{ flex: 1, fontSize: 13, padding: 10, borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", color: "var(--terracotta-dark)", fontWeight: 600 }}
            >
              ❌ Pas disponible
            </button>
          </div>
        )}

        {isCourier && order.courierStatus === "unavailable" && (
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--terracotta-dark)", fontWeight: 600 }}>
            Tu as indiqué ne pas être disponible pour cette commande.
          </p>
        )}

        {isCourier && order.courierStatus === "available" && !order.deliveryProofUrl && (
          <button
            className="btn-primary"
            onClick={onSubmitProof}
            disabled={uploadingProof}
            style={{ width: "100%", marginTop: 12, fontSize: 13, padding: 10 }}
          >
            {uploadingProof ? "Envoi de la preuve..." : "🏁 Terminer la course"}
          </button>
        )}

        {order.deliveryProofUrl && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "var(--green-dark)", fontWeight: 600, marginBottom: 6 }}>
              ✅ Preuve de livraison envoyée
            </p>
            <img src={order.deliveryProofUrl} alt="Preuve de livraison" style={{ width: "100%", borderRadius: 8 }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationById() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [orderCache, setOrderCache] = useState({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const proofFileRef = useRef(null);

  const load = () => {
    if (!id) return;
    api.get(`/messages/${id}`).then((r) => {
      setConversation(r.data.conversation);
      setMessages(r.data.messages);

      const orderIds = [...new Set(r.data.messages.filter((m) => m.kind === "order_summary" && m.order).map((m) => m.order._id))];
      orderIds.forEach((orderId) => {
        api.get(`/orders/${orderId}`).then((res) => {
          setOrderCache((prev) => ({ ...prev, [orderId]: res.data }));
        }).catch(() => {});
      });
    });
  };

  useEffect(() => {
    if (!loading && user && id) {
      load();
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
    }
  }, [loading, user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${id}`, { text });
      setText("");
      load();
    } finally {
      setSending(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await api.post(`/messages/${id}`, { imageUrl: url });
      load();
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRespond = async (orderId, available) => {
    setResponding(true);
    try {
      await api.put(`/orders/${orderId}/courier-response`, { available });
      load();
    } finally {
      setResponding(false);
    }
  };

  const handleSubmitProofClick = () => {
    proofFileRef.current?.click();
  };

  const handleProofPick = async (e, orderId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const url = await uploadToCloudinary(file);
      await api.put(`/orders/${orderId}/delivery-proof`, { imageUrl: url });
      await api.post(`/messages/${id}`, { text: "📸 Preuve de livraison envoyée.", imageUrl: url });
      load();
    } catch {
      // ignore
    } finally {
      setUploadingProof(false);
      if (proofFileRef.current) proofFileRef.current.value = "";
    }
  };

  if (loading || !conversation) return null;

  const isCourierView = conversation.courier && conversation.courier._id === user._id;
  const otherUserId = conversation.type === "shop_courier"
    ? (user.role === "marchand" ? conversation.courier?._id : conversation.shop?.owner?._id)
    : (user.role === "client" ? conversation.shop?.owner?._id : conversation.client?._id);
  const title = conversation.type === "shop_courier"
    ? (user.role === "marchand" ? conversation.courier?.name : conversation.shop?.name)
    : (user.role === "client" ? conversation.shop?.name : conversation.client?.name);
  const avatarUrl = user.role === "client" ? conversation.shop?.logoUrl : conversation.client?.avatarUrl;
  const phone = conversation.type === "shop_courier"
    ? (user.role === "marchand" ? conversation.courier?.phone : conversation.shop?.owner?.phone)
    : (user.role === "marchand" ? conversation.client?.phone : conversation.shop?.owner?.phone);
  const waBase = whatsappBase(phone);

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 76px)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <a href={otherUserId ? `/profil/${otherUserId}` : "#"} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={title} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                {title?.[0]?.toUpperCase()}
              </div>
            )}
            <h1 style={{ fontSize: 18 }}>{title || "Conversation"}</h1>
          </a>
          {waBase && (
            <div style={{ display: "flex", gap: 8 }}>
              <a href={waBase} target="_blank" rel="noreferrer" title="Appel audio via WhatsApp" style={{ fontSize: 18 }}>
                📞
              </a>
              <a href={waBase} target="_blank" rel="noreferrer" title="Appel vidéo via WhatsApp" style={{ fontSize: 18 }}>
                🎥
              </a>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 10 }}>
          {messages.map((m) => {
            const isMine = m.senderRole === user.role;

            if (m.kind === "order_summary" && m.order) {
              const order = orderCache[m.order._id] || m.order;
              return (
                <OrderSummaryCard
                  key={m._id}
                  order={order}
                  isCourier={isCourierView}
                  responding={responding}
                  uploadingProof={uploadingProof}
                  onRespond={(available) => handleRespond(order._id, available)}
                  onSubmitProof={handleSubmitProofClick}
                />
              );
            }

            return (
              <div
                key={m._id}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  background: isMine ? "var(--ink)" : "var(--white)",
                  color: isMine ? "var(--white)" : "var(--ink)",
                  border: isMine ? "none" : "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "8px 12px",
                  maxWidth: "75%",
                  fontSize: 13,
                }}
              >
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="Image" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: m.text ? 6 : 0, display: "block" }} />
                )}
                {m.text}
              </div>
            );
          })}
          {messages.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginTop: 20 }}>
              Aucun message pour l'instant.
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <input
          ref={proofFileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const orderId = Object.keys(orderCache).find((oid) => orderCache[oid].courierStatus === "available" && !orderCache[oid].deliveryProofUrl);
            if (orderId) handleProofPick(e, orderId);
          }}
        />

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--line)", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Envoyer une image"
            style={{ fontSize: 20, padding: "6px 8px" }}
          >
            {uploading ? "..." : "📷"}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris un message..."
            style={{ flex: 1, padding: 10, border: "1px solid var(--line)", borderRadius: 20, fontSize: 13, boxSizing: "border-box" }}
          />
          <button className="btn-primary" disabled={sending || !text.trim()} style={{ borderRadius: 20, padding: "10px 18px" }}>
            Envoyer
          </button>
        </form>
      </main>
    </>
  );
}
