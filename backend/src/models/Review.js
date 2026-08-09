const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Un client ne peut laisser qu'un seul avis par commande/boutique
reviewSchema.index({ order: 1, shop: 1, client: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
