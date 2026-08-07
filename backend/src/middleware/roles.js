// Usage : authorize("admin"), authorize("marchand", "admin")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé : rôle '${req.user ? req.user.role : "inconnu"}' non autorisé pour cette action.`,
      });
    }
    next();
  };
};

module.exports = { authorize };
