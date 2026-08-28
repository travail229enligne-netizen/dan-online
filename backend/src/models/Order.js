const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    deliveryAddress: { type: String, required: true },
    deliveryPhone: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["kkiapay", "cod"],
      default: "cod",
    },
    kkiapayTransactionId: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    // SLA de livraison affiché au client
    expectedDeliveryHours: { type: Number, default: 48 },
    itemsTotal: { type: Number, required: true },
    commissionAmount: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    paidAt: { type: Date, default: null }, // date de confirmation du paiement (en ligne ou a la livraison)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
