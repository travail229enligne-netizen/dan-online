const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["client_shop", "shop_courier"],
      default: "client_shop",
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // utilise si type = client_shop
    courier: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // utilise si type = shop_courier
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null }, // commande liee, si type = shop_courier
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadForClient: { type: Number, default: 0 }, // sert aussi pour le livreur si type = shop_courier
    unreadForMerchant: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ client: 1, shop: 1 }, { unique: true, partialFilterExpression: { type: "client_shop" } });

module.exports = mongoose.model("Conversation", conversationSchema);
