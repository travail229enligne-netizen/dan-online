const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, address } = req.body;

  if (email) {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ message: "Ce numéro de téléphone est déjà utilisé." });
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    address,
    role: role === "marchand" ? "marchand" : "client",
  });

  res.status(201).json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @route   POST /api/auth/login
// @access  Public - accepte email OU téléphone dans le champ "identifier"
const login = asyncHandler(async (req, res) => {
  const { email, phone, identifier, password } = req.body;
  const value = (identifier || email || phone || "").trim();

  if (!value || !password) {
    return res.status(400).json({ message: "Identifiant et mot de passe requis." });
  }

  const user = await User.findOne({
    $or: [{ email: value.toLowerCase() }, { phone: value }],
  });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Identifiant ou mot de passe incorrect." });
  }

  res.json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// @route   PUT /api/auth/me
// @access  Private - met a jour son propre profil
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  const fields = ["name", "avatarUrl", "bio", "locationLabel", "locationMapUrl"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });

  if (req.body.privacy) {
    if (req.body.privacy.showPhone !== undefined) user.privacy.showPhone = !!req.body.privacy.showPhone;
    if (req.body.privacy.showLocation !== undefined) user.privacy.showLocation = !!req.body.privacy.showLocation;
  }

  await user.save();
  res.json({ user: user.toSafeObject() });
});

// @route   PUT /api/auth/set-password
// @access  Private - permet à un compte créé silencieusement (sans mot de passe) d'en définir un
const setPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  if (user.password) {
    return res.status(400).json({ message: "Un mot de passe est déjà défini sur ce compte." });
  }

  user.password = password;
  await user.save();

  res.json({ user: user.toSafeObject() });
});

// @route   GET /api/auth/user/:id
// @access  Public - profil public, ne renvoie que ce que l'utilisateur a choisi de partager
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  const publicProfile = {
    _id: user._id,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
  if (user.privacy?.showPhone) publicProfile.phone = user.phone;
  if (user.privacy?.showLocation) {
    publicProfile.locationLabel = user.locationLabel;
    publicProfile.locationMapUrl = user.locationMapUrl;
  }

  res.json(publicProfile);
});

module.exports = { register, login, getMe, updateProfile, setPassword, getPublicProfile };
