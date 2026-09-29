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
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/set-password", protect, setPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/user/:id", getPublicProfile);

module.exports = router;
