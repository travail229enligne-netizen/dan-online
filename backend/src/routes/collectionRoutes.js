const express = require("express");
const {
  getShopCollections,
  searchCollections,
  getMyCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/collectionController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/search", searchCollections);
router.get("/shop/:shopId", getShopCollections);
router.get("/mine", protect, authorize("marchand"), getMyCollections);
router.post("/", protect, authorize("marchand"), createCollection);
router.put("/:id", protect, authorize("marchand"), updateCollection);
router.delete("/:id", protect, authorize("marchand"), deleteCollection);

module.exports = router;
