const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} = require("../controllers/tenantController");

router.get("/",       auth, getAllTenants);
router.get("/:id",    auth, getTenantById);
router.post("/",      auth, createTenant);
router.put("/:id",    auth, updateTenant);
router.delete("/:id", auth, deleteTenant);

module.exports = router;