const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { sendEmail } = require("../utils/email");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// @route   POST /api/auth/forgot-password
// @access  Public - envoie un lien de reinitialisation par email si un compte
// avec cet email existe. Repond toujours pareil pour ne pas reveler si
// l'email existe ou non.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMessage = "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.";

  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email requis." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "https://dan-online.vercel.app";
    const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${rawToken}&id=${user._id}`;

    await sendEmail(
      user.email,
      "Réinitialisation de ton mot de passe Shopyz",
      `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="color: #111;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${user.name},</p>
          <p>Tu as demandé à réinitialiser ton mot de passe Shopyz. Clique sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans 30 minutes.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #111; color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.</p>
          <p style="color: #666; font-size: 13px;">L'équipe Shopyz</p>
        </div>
      `
    );
  }

  res.json({ message: genericMessage });
});

// @route   POST /api/auth/reset-password
// @access  Public - definit le nouveau mot de passe a partir du jeton recu par email
const resetPassword = asyncHandler(async (req, res) => {
  const { id, token, password } = req.body;

  if (!id || !token || !password) {
    return res.status(400).json({ message: "Requête invalide." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
  }

  const user = await User.findById(id);
  if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpires) {
    return res.status(400).json({ message: "Lien invalide ou expiré." });
  }

  if (user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: "Ce lien a expiré. Refais une demande." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  if (tokenHash !== user.resetPasswordTokenHash) {
    return res.status(400).json({ message: "Lien invalide ou expiré." });
  }

  user.password = password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: "Mot de passe réinitialisé avec succès. Tu peux te connecter." });
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


// @route   POST /api/auth/google
// @access  Public - connexion/inscription via un compte Google
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Jeton Google manquant." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: "Jeton Google invalide." });
  }

  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ googleId });

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.googleId = googleId;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      await user.save();
    }
  }

  if (!user) {
    user = await User.create({
      name: name || "Utilisateur Shopyz",
      email: email ? email.toLowerCase() : undefined,
      googleId,
      avatarUrl: picture || "",
      role: "client",
    });
  }

  res.json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});


// @route   PUT /api/auth/change-password
// @access  Private - change le mot de passe en verifiant l'ancien
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  if (!user.password) {
    return res.status(400).json({ message: "Ce compte n'a pas encore de mot de passe. Utilise plutot la definition initiale." });
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Ancien mot de passe incorrect." });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Mot de passe modifie avec succes." });
});

module.exports = {
  register,
  changePassword,
  googleAuth,
  login,
  getMe,
  updateProfile,
  setPassword,
  forgotPassword,
  resetPassword,
  getPublicProfile,
};
