const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["client", "marchand"], required: true },
    text: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
