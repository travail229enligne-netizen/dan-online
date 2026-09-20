import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/Header";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const CLOUD_NAME = "op1wrztj";
const UPLOAD_PRESET = "dan-online";

function telLink(phone) {
  if (!phone) return null;
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function formatDuration(seconds) {
  const s = Math.round(seconds || 0);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, "0")}`;
}

function MicIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18v3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 21h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function OrderSummaryCard({ order, isCourier, onRespond, onSubmitProof, responding, uploadingProof, onSubmitPaymentProof, uploadingPaymentProof }) {
  if (!order) {
    return (
      <div style={{ flexShrink: 0, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", maxWidth: "90%", alignSelf: "flex-start" }}>
        <div style={{ padding: "10px 14px", background: "var(--cream)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>
            📦 Commande à livrer
          </span>
        </div>
        <div style={{ padding: 14, fontSize: 12, color: "var(--ink-soft)" }}>Chargement du bilan de commande...</div>
      </div>
    );
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return (
      <div style={{ flexShrink: 0, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", maxWidth: "90%", alignSelf: "flex-start" }}>
        <div style={{ padding: "10px 14px", background: "var(--cream)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>
            📦 Commande à livrer
          </span>
        </div>
        <div style={{ padding: 14, fontSize: 12, color: "var(--ink-soft)" }}>
          Détails de cette commande indisponibles (commande ancienne ou supprimée).
        </div>
      </div>
    );
  }

  return (
    <div style={{ flexShrink: 0, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", maxWidth: "90%", alignSelf: "flex-start" }}>
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
          Total : <span style={{ color: "var(--terracotta-dark)" }}>{(order.grandTotal || 0).toLocaleString("fr-FR")} FCFA</span>
        </div>
        <div style={{ marginTop: 8, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          <div>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</div>
          <div>📞 {order.deliveryPhone}</div>
          <div style={{ fontWeight: 600, color: order.paymentMethod === "kkiapay" && order.paymentStatus === "paid" ? "var(--green-dark)" : "var(--terracotta-dark)" }}>
            {order.paymentMethod === "kkiapay"
              ? order.paymentStatus === "paid"
                ? "💳 Réglée en ligne"
                : "💳 Le client réglera en ligne après la livraison"
              : `💵 À encaisser : ${(order.grandTotal || 0).toLocaleString("fr-FR")} FCFA`}
          </div>
        </div>

        {isCourier && order.courierStatus === "pending" && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" onClick={() => onRespond(true)} disabled={responding} style={{ flex: 1, fontSize: 13, padding: 10 }}>
              {responding ? "..." : "✅ Disponible"}
            </button>
            <button onClick={() => onRespond(false)} disabled={responding} style={{ flex: 1, fontSize: 13, padding: 10, borderRadius: 10, border: "1px solid var(--line)", background: "var(--white)", color: "var(--terracotta-dark)", fontWeight: 600 }}>
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
          <>
            <p style={{ marginTop: 12, fontSize: 11, color: "var(--ink-soft)" }}>
              Prends une photo montrant le colis remis au client.
            </p>
            <button className="btn-primary" onClick={onSubmitProof} disabled={uploadingProof} style={{ width: "100%", marginTop: 6, fontSize: 13, padding: 10 }}>
              {uploadingProof ? "Envoi de la preuve..." : "🏁 Terminer la course"}
            </button>
          </>
        )}

        {order.deliveryProofUrl && (
          <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}>
            <div style={{ padding: "6px 10px", background: "#e8f5ee", fontSize: 11, fontWeight: 700, color: "var(--green-dark)" }}>
              ✅ Preuve de livraison
            </div>
            <img src={order.deliveryProofUrl} alt="Preuve de livraison" style={{ width: "100%", display: "block" }} />
            {order.paymentMethod === "kkiapay" && (
              <div style={{ padding: "8px 10px", fontSize: 11, color: order.paymentStatus === "paid" ? "var(--green-dark)" : "var(--terracotta-dark)", fontWeight: 600 }}>
                {order.paymentStatus === "paid" ? "✅ Client a payé en ligne" : "⏳ En attente du paiement du client"}
              </div>
            )}
          </div>
        )}

        {isCourier && order.deliveryProofUrl && order.paymentMethod === "cod" && order.paymentStatus !== "paid" && (
          <button className="btn-primary" onClick={onSubmitPaymentProof} disabled={uploadingPaymentProof} style={{ width: "100%", marginTop: 10, fontSize: 13, padding: 10 }}>
            {uploadingPaymentProof ? "Envoi de la preuve..." : "📸 Preuve du paiement"}
          </button>
        )}

        {order.paymentProofUrl && (
          <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}>
            <div style={{ padding: "6px 10px", background: "#e8f5ee", fontSize: 11, fontWeight: 700, color: "var(--green-dark)" }}>
              ✅ Preuve de paiement en espèces
            </div>
            <img src={order.paymentProofUrl} alt="Preuve de paiement" style={{ width: "100%", display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function ImageBubble({ url, caption, isMine }) {
  return (
    <div style={{ flexShrink: 0, alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "75%", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "var(--white)" }}>
      <img src={url} alt={caption || "Image"} style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "cover" }} />
      {caption && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: isMine ? "var(--white)" : "var(--ink)", background: isMine ? "var(--ink)" : "var(--white)" }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function VoiceBubble({ url, duration, isMine }) {
  return (
    <div
      style={{
        flexShrink: 0,
        alignSelf: isMine ? "flex-end" : "flex-start",
        maxWidth: "75%",
        borderRadius: 14,
        padding: "10px 12px",
        background: isMine ? "var(--ink)" : "var(--white)",
        border: isMine ? "none" : "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MicIcon size={16} color={isMine ? "var(--white)" : "var(--ink)"} />
        <audio controls src={url} style={{ height: 34, maxWidth: 200 }} />
      </div>
      {duration > 0 && (
        <span style={{ fontSize: 11, color: isMine ? "rgba(255,255,255,0.7)" : "var(--ink-soft)" }}>
          {formatDuration(duration)}
        </span>
      )}
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
  const paymentProofFileRef = useRef(null);
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

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

  const uploadToCloudinary = async (file, resourceType = "auto") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "image");
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
      const url = await uploadToCloudinary(file, "image");
      await api.put(`/orders/${orderId}/delivery-proof`, { imageUrl: url });
      await api.post(`/messages/${id}`, { text: "📸 Preuve de livraison envoyée." });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'envoyer la preuve.");
    } finally {
      setUploadingProof(false);
      if (proofFileRef.current) proofFileRef.current.value = "";
    }
  };

  const handleSubmitPaymentProofClick = () => {
    paymentProofFileRef.current?.click();
  };

  const handlePaymentProofPick = async (e, orderId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPaymentProof(true);
    try {
      const url = await uploadToCloudinary(file, "image");
      await api.put(`/orders/${orderId}/payment-proof`, { imageUrl: url });
      await api.post(`/messages/${id}`, { text: "📸 Preuve de paiement envoyée." });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'envoyer la preuve de paiement.");
    } finally {
      setUploadingPaymentProof(false);
      if (paymentProofFileRef.current) paymentProofFileRef.current.value = "";
    }
  };

  const startRecording = async () => {
    setVoiceError("");
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setVoiceError("L'enregistrement audio n'est pas supporté sur cet appareil.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setVoiceError("Impossible d'accéder au micro. Vérifie les autorisations.");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordTimerRef.current);
    setRecording(false);
    setRecordSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !recording) return;
    const finalDuration = recordSeconds;
    mediaRecorderRef.current.onstop = async () => {
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      audioChunksRef.current = [];
      setUploadingVoice(true);
      try {
        const file = new File([blob], `vocal-${Date.now()}.webm`, { type: "audio/webm" });
        const url = await uploadToCloudinary(file, "video");
        await api.post(`/messages/${id}`, { audioUrl: url, audioDuration: finalDuration });
        load();
      } catch {
        setVoiceError("Impossible d'envoyer le message vocal.");
      } finally {
        setUploadingVoice(false);
      }
    };
    mediaRecorderRef.current.stop();
    clearInterval(recordTimerRef.current);
    setRecording(false);
    setRecordSeconds(0);
  };

  useEffect(() => {
    return () => clearInterval(recordTimerRef.current);
  }, []);

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
  const phoneLink = telLink(phone);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <Header hideSearchBar />
      </div>
      <main className="container" style={{ flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 16, paddingBottom: 12, boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexShrink: 0 }}>
          <a href={otherUserId ? `/profil/${otherUserId}` : "#"} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={title} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {title?.[0]?.toUpperCase()}
              </div>
            )}
            <h1 style={{ fontSize: 18, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || "Conversation"}</h1>
          </a>
          {phoneLink && (
            <a href={phoneLink} title="Appeler" style={{ fontSize: 18, flexShrink: 0, marginRight: 10 }}>📞</a>
          )}
        </div>

        <div style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 10 }}>
          {messages.map((m) => {
            const isMine = m.sender === user._id || m.sender?._id === user._id;

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
                  onSubmitPaymentProof={handleSubmitPaymentProofClick}
                  uploadingPaymentProof={uploadingPaymentProof}
                />
              );
            }

            if (m.kind === "voice" && m.audioUrl) {
              return <VoiceBubble key={m._id} url={m.audioUrl} duration={m.audioDuration} isMine={isMine} />;
            }

            if (m.imageUrl) {
              return <ImageBubble key={m._id} url={m.imageUrl} caption={m.text} isMine={isMine} />;
            }

            return (
              <div key={m._id} style={{ flexShrink: 0, alignSelf: isMine ? "flex-end" : "flex-start", background: isMine ? "var(--ink)" : "var(--white)", color: isMine ? "var(--white)" : "var(--ink)", border: isMine ? "none" : "1px solid var(--line)", borderRadius: 14, padding: "8px 12px", maxWidth: "75%", fontSize: 13 }}>
                {m.text}
              </div>
            );
          })}
          {messages.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginTop: 20 }}>Aucun message pour l'instant.</p>
          )}
          <div ref={bottomRef} style={{ flexShrink: 0 }} />
        </div>

        <input
          ref={proofFileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const orderId = Object.keys(orderCache).find((oid) => orderCache[oid].courierStatus === "available" && !orderCache[oid].deliveryProofUrl);
            if (orderId) handleProofPick(e, orderId);
          }}
        />

        <input
          ref={paymentProofFileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const orderId = Object.keys(orderCache).find(
              (oid) => orderCache[oid].deliveryProofUrl && orderCache[oid].paymentMethod === "cod" && orderCache[oid].paymentStatus !== "paid"
            );
            if (orderId) handlePaymentProofPick(e, orderId);
          }}
        />

        {voiceError && (
          <p style={{ fontSize: 12, color: "var(--terracotta-dark)", marginBottom: 6, flexShrink: 0 }}>{voiceError}</p>
        )}

        {recording ? (
          <div style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: "1px solid var(--line)", alignItems: "center", flexShrink: 0, width: "100%", boxSizing: "border-box" }}>
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Annuler l'enregistrement"
              style={{ fontSize: 16, padding: "6px 8px", color: "var(--terracotta-dark)", flexShrink: 0 }}
            >
              ✕
            </button>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", overflow: "hidden" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--terracotta-dark)", display: "inline-block", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Enregistrement... {formatDuration(recordSeconds)}</span>
            </div>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="btn-primary"
              style={{ borderRadius: 20, padding: "8px 14px", fontSize: 13, flexShrink: 0 }}
            >
              Envoyer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: "1px solid var(--line)", alignItems: "center", flexShrink: 0, width: "100%", boxSizing: "border-box" }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Envoyer une image"
              style={{ fontSize: 18, padding: "4px 6px", flexShrink: 0, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {uploading ? "..." : "📷"}
            </button>
            <button
              type="button"
              onClick={startRecording}
              disabled={uploadingVoice}
              aria-label="Enregistrer un message vocal"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {uploadingVoice ? "..." : <MicIcon size={16} color="var(--ink)" />}
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écris un message..."
              style={{ flex: "1 1 0%", minWidth: 0, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 20, fontSize: 13, boxSizing: "border-box" }}
            />
            <button
              className="btn-primary"
              disabled={sending || !text.trim()}
              style={{ borderRadius: 20, padding: "9px 14px", fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Envoyer
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
