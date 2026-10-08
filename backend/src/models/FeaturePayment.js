const mongoose = require("mongoose");

const featurePaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: String, enum: ["shop", "product"], required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    days: { type: Number, required: true },
    amount: { type: Number, required: true },
    fedapayTransactionId: { type: String, default: "" },
    status: { type: String, enum: ["pending", "applied"], default: "pending" },
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeaturePayment", featurePaymentSchema);
