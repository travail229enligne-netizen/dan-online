const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { timestamps: true, _id: false }
);

const fairEntrySchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { _id: false }
);

const fairSchema = new mongoose.Schema(
  {
    organizerShop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [participantSchema],
    entries: [fairEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fair", fairSchema);
