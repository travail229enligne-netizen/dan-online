const express = require("express");
const {
  register,
  login,
  getMe,
  updateProfile,
  setPassword,
  forgotPassword,
  resetPassword,
  getPublicProfile,
  googleAuth,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/set-password", protect, setPassword);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/user/:id", getPublicProfile);
router.post("/google", googleAuth);

module.exports = router;
