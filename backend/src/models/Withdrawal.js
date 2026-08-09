const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    amount: { type: Number, required: true, min: 0 },
    phone: { type: String, required: true }, // numero Mobile Money pour le versement
    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
    },
    processedAt: { type: Date, default: null },
    note: { type: String, default: "" }, // ex. raison du refus
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
