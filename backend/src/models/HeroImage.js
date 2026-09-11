const mongoose = require("mongoose");

const heroImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    businessType: {
      type: String,
      enum: ["boutique", "restaurant", "supermarche", "grossiste", "artisan"],
      required: true,
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroImage", heroImageSchema);
