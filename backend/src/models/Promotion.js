const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["all", "products"], default: "all" },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, default: null },
    timesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

promotionSchema.index({ shop: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Promotion", promotionSchema);
