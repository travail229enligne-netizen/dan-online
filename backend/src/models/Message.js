const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["client", "marchand", "livreur"], required: true },
    kind: { type: String, enum: ["text", "order_summary", "voice"], default: "text" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    text: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" }, // utilise si kind = voice
    audioDuration: { type: Number, default: 0 }, // duree en secondes, pour l'affichage
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
