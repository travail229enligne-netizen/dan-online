const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true, trim: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Collection", collectionSchema);
