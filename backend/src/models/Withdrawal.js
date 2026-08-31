const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["shop", "courier", "admin"],
      default: "shop",
    },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
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
