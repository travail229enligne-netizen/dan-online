const express = require("express");
const { getPlatformCouriers } = require("../controllers/platformCourierController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getPlatformCouriers);

module.exports = router;
