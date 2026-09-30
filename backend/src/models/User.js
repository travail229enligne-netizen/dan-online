const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: function () { return !this.googleId; }, unique: true, sparse: true, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String },
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
    // Reinitialisation de mot de passe par email : on stocke un hash du
    // jeton (jamais le jeton en clair), avec une date d'expiration courte.
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  obj.hasPassword = !!this.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
