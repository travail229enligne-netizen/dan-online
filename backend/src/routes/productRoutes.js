const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsCSV,
} = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/", getProducts);
router.post("/import", protect, authorize("marchand"), importProductsCSV);
router.get("/:id", getProductById);
router.post("/", protect, authorize("marchand"), createProduct);
router.put("/:id", protect, authorize("marchand"), updateProduct);
router.delete("/:id", protect, authorize("marchand"), deleteProduct);

module.exports = router;
