const express = require("express");
const {
  getMyWallet,
  requestWithdrawal,
  getMyCourierWallet,
  requestCourierWithdrawal,
} = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("marchand"), getMyWallet);
router.post("/withdraw", authorize("marchand"), requestWithdrawal);

router.get("/courier/me", getMyCourierWallet);
router.post("/courier/withdraw", requestCourierWithdrawal);

module.exports = router;
