const mongoose = require("mongoose");

const priceTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const variantOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

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
    slug: { type: String, unique: true, sparse: true, lowercase: true }, // lien lisible, ex: durag-original-a3f2
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
