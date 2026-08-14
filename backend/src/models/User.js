const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "marchand", "admin"], default: "client" },
    isActive: { type: Boolean, default: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    address: { type: String, default: "" },

    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 200 },
    locationLabel: { type: String, default: "" },
    locationMapUrl: { type: String, default: "" },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
