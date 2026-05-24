const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    getAllRooms,
    getRoomById,
    getRoomTenants,
    createRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");


router.get("/",      auth, getAllRooms);
router.get("/:id",   auth, getRoomById);
router.get("/:id/tenants", auth, getRoomTenants);
router.post("/",     auth, createRoom);
router.put("/:id",   auth, updateRoom);
router.delete("/:id",auth, deleteRoom);

module.exports = router;