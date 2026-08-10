const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadForClient: { type: Number, default: 0 },
    unreadForMerchant: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ client: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
