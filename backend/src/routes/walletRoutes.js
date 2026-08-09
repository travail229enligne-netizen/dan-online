const express = require("express");
const { getMyWallet, requestWithdrawal } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("marchand"));

router.get("/me", getMyWallet);
router.post("/withdraw", requestWithdrawal);

module.exports = router;
