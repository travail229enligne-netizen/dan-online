const mongoose = require("mongoose");

const priceTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "unité" },
    stock: { type: Number, required: true, default: 0, min: 0 },
    images: [{ type: String }],
    priceTiers: [priceTierSchema],
    isActive: { type: Boolean, default: true },
    featuredUntil: { type: Date, default: null },
    soldCount: { type: Number, default: 0 },
    // Nombre de fois que la fiche produit a ete consultee, utilise dans les
    // statistiques de performance cote marchand (vues vs commandes)
    viewCount: { type: Number, default: 0 },
    prepTimeMinutes: { type: Number, default: null },
    isDailySpecial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
