const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  endContract,
  transferRepresentative,
} = require("../controllers/contractController");

router.get("/",             auth, getAllContracts);
router.get("/:id",          auth, getContractById);
router.post("/",            auth, createContract);
router.put("/:id",          auth, updateContract);
router.put("/:id/end",      auth, endContract);
router.put("/:id/transfer", auth, transferRepresentative);

module.exports = router;