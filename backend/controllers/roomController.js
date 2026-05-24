const Room = require("../models/room");
const Tenant = require("../models/tenant");

// GET /rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });

    const roomsWithCount = await Promise.all(
      rooms.map(async (room) => {
        const currentPeople = await Tenant.countDocuments({
          roomId: room._id,
          active: true,
        });
        return { ...room.toObject(), currentPeople };
      })
    );

    res.json(roomsWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /rooms/:id/tenants
const getRoomTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ roomId: req.params.id, active: true });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /rooms
const createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /rooms/:id
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    if (room.status === "occupied") {
      return res.status(400).json({ message: "Phòng đang có người ở, không thể xóa" });
    }
    await room.deleteOne();
    res.json({ message: "Xóa phòng thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllRooms, getRoomById, getRoomTenants, createRoom, updateRoom, deleteRoom };