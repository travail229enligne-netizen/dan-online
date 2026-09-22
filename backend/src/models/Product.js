const mongoose = require("mongoose");

const priceTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Une option de variante (ex: "Sans fil"), avec un prix optionnel qui
// remplace le prix de base du produit si le client la choisit.
const variantOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

// Un groupe de variantes (ex: "Type" avec les options "Avec fil"/"Sans fil",
// ou "Couleur" avec "Rouge"/"Bleu"/"Noir")
const variantGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    options: [variantOptionSchema],
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
    variantGroups: [variantGroupSchema],
    isActive: { type: Boolean, default: true },
    featuredUntil: { type: Date, default: null },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    prepTimeMinutes: { type: Number, default: null },
    isDailySpecial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
