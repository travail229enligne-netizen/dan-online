const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const courierSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const shopSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    themeColor: { type: String, default: "#c1592b" },
    businessType: {
      type: String,
      enum: ["boutique", "restaurant", "supermarche", "grossiste", "artisan"],
      default: "boutique",
    },
    city: { type: String, default: "" },
    location: {
      allee: { type: String, default: "" },
      numero: { type: String, default: "" },
    },
    deliveryZones: [deliveryZoneSchema],
    couriers: [courierSchema],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    isVerified: { type: Boolean, default: false },
    isProfessional: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "closed"],
      default: "pending",
    },
    // Indique si le marchand a deja ete redirige automatiquement vers
    // l'ajout de produits apres la premiere validation de sa boutique
    productsOnboardingDone: { type: Boolean, default: false },
    rent: {
      amount: { type: Number, default: 0 },
      period: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
      lastPaidAt: { type: Date, default: null },
      nextDueAt: { type: Date, default: null },
    },
    commissionRate: { type: Number, default: null },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);
