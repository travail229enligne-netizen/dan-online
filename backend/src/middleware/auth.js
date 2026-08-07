const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: "Compte inactif ou introuvable." });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Session invalide, veuillez vous reconnecter." });
    }
  }

  return res.status(401).json({ message: "Accès refusé : token manquant." });
});

module.exports = { protect };
