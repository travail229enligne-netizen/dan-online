const express = require("express");
const { getMyFollows, getFollowStatus, followShop, unfollowShop } = require("../controllers/followController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("client"));

router.get("/", getMyFollows);
router.get("/status/:shopId", getFollowStatus);
router.post("/:shopId", followShop);
router.delete("/:shopId", unfollowShop);

module.exports = router;
