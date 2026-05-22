const Contract = require("../models/contract");
const Room = require("../models/room");
const Tenant = require("../models/tenant");

// GET /contracts — danh sách hợp đồng
const getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate("roomId", "roomNumber floor price")
      .populate("tenantId", "fullName phone")
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /contracts/:id — chi tiết 1 hợp đồng
const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("roomId", "roomNumber floor price")
      .populate("tenantId", "fullName phone cccd");
    if (!contract) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /contracts — tạo hợp đồng mới
const createContract = async (req, res) => {
  try {
    const { roomId, tenantId, startDate, rentPrice, deposit } = req.body;

    // Kiểm tra phòng tồn tại không
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    // Kiểm tra phòng đang có hợp đồng active chưa
    const existingContract = await Contract.findOne({ roomId, status: "active" });
    if (existingContract) {
      return res.status(400).json({ message: "Phòng đang có hợp đồng active" });
    }

    // Kiểm tra tenant tồn tại không
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy khách thuê" });

    const contract = await Contract.create({
      roomId,
      tenantId,
      startDate,
      rentPrice: rentPrice || room.price, // mặc định lấy giá phòng
      deposit: deposit || 0,
    });

    // Cập nhật trạng thái phòng
    await Room.findByIdAndUpdate(roomId, { status: "occupied" });

    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /contracts/:id — sửa hợp đồng
const updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!contract) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /contracts/:id/end — kết thúc hợp đồng
const endContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    if (contract.status === "ended") {
      return res.status(400).json({ message: "Hợp đồng đã kết thúc rồi" });
    }

    // Cập nhật hợp đồng
    contract.status = "ended";
    contract.endDate = req.body.endDate || new Date();
    await contract.save();

    // Cập nhật tenant active = false
    await Tenant.findByIdAndUpdate(contract.tenantId, {
      active: false,
      roomId: null,
    });

    // Cập nhật phòng về empty
    await Room.findByIdAndUpdate(contract.roomId, { status: "empty" });

    res.json({ message: "Kết thúc hợp đồng thành công", contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  endContract,
};