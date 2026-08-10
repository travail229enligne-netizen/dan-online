const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    themeColor: { type: String, default: "#c1592b" },
    // "Allée numérique" = emplacement virtuel, ex: "Allée 3, N°45"
    location: {
      allee: { type: String, default: "" },
      numero: { type: String, default: "" },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    isVerified: { type: Boolean, default: false }, // badge "Vérifié"
    isProfessional: { type: Boolean, default: false }, // badge "Boutique professionnelle" accorde par admin
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
