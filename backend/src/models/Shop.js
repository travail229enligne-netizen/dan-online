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
    // "Allée numérique" = emplacement virtuel, ex: "Allée 3, N°45"
    city: { type: String, default: "" },
    location: {
      allee: { type: String, default: "" },
      numero: { type: String, default: "" },
    },
    deliveryZones: [deliveryZoneSchema], // tarifs de livraison par ville
    couriers: [courierSchema], // livreurs ajoutes par le marchand
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    isVerified: { type: Boolean, default: false }, // badge "Vérifié"
    isProfessional: { type: Boolean, default: false }, // badge "Boutique professionnelle" accorde par admin
    featuredUntil: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "closed"],
      default: "pending",
    },
    // Loyer de l'emplacement virtuel (abonnement plateforme)
    rent: {
      amount: { type: Number, default: 0 },
      period: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
      lastPaidAt: { type: Date, default: null },
      nextDueAt: { type: Date, default: null },
    },
    // Commission spécifique à cette boutique (sinon valeur par défaut de la plateforme)
    commissionRate: { type: Number, default: null },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);
