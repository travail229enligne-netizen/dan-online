const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

// @route  POST /api/auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, address } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Cet email est déjà utilisé." });
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    address,
    // un client peut s'auto-inscrire ; un compte "marchand" démarre en attente de validation admin
    role: role === "marchand" ? "marchand" : "client",
  });

  res.status(201).json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @route  POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }

  res.json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, getMe };
