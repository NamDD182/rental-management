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
    const { roomId, tenantId, startDate, endDate, rentPrice, deposit, note, contractFile, isRenewal } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    const existingContract = await Contract.findOne({ roomId, status: "active" });

    if (existingContract) {
      // Nếu là gia hạn thì tự động end contract cũ
      if (isRenewal) {
        existingContract.status  = "ended";
        existingContract.endDate = new Date(startDate);
        await existingContract.save();
      } else {
        return res.status(400).json({ message: "Phòng đang có hợp đồng active" });
      }
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy khách thuê" });

    const contract = await Contract.create({
      roomId,
      tenantId,
      startDate,
      endDate:   endDate || null,
      rentPrice: rentPrice || room.price,
      deposit:   deposit  || 0,
      note:      note     || "",
      contractFile: contractFile || "",
    });

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

    // Cập nhật tenant đại diện active = false (giữ roomId để lưu lịch sử người ở)
    await Tenant.findByIdAndUpdate(contract.tenantId, {
      active: false,
    });

    // Chỉ set phòng về empty khi không còn khách nào ở (tránh làm trống phòng còn người)
    const remaining = await Tenant.countDocuments({
      roomId: contract.roomId,
      active: true,
    });
    if (remaining === 0) {
      await Room.findByIdAndUpdate(contract.roomId, { status: "empty" });
    }

    res.json({ message: "Kết thúc hợp đồng thành công", contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /contracts/:id/transfer — đổi người đại diện (giữ nguyên hợp đồng)
const transferRepresentative = async (req, res) => {
  try {
    const { newTenantId } = req.body;
    if (!newTenantId) {
      return res.status(400).json({ message: "Thiếu người đại diện mới" });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    if (contract.status !== "active") {
      return res.status(400).json({ message: "Hợp đồng đã kết thúc" });
    }

    const oldTenantId = contract.tenantId.toString();
    if (oldTenantId === newTenantId) {
      return res.status(400).json({ message: "Người đại diện mới trùng với người hiện tại" });
    }

    // Người đại diện mới phải đang ở chính phòng này và còn active
    const newTenant = await Tenant.findById(newTenantId);
    if (!newTenant || !newTenant.active) {
      return res.status(404).json({ message: "Không tìm thấy khách thuê hợp lệ" });
    }
    if (!newTenant.roomId || newTenant.roomId.toString() !== contract.roomId.toString()) {
      return res.status(400).json({ message: "Khách này không ở trong phòng của hợp đồng" });
    }

    // 1) Đổi người đại diện trên hợp đồng
    contract.tenantId = newTenantId;
    await contract.save();

    // 2) Người đại diện cũ rời đi: ngừng active (giữ roomId để lưu lịch sử)
    await Tenant.findByIdAndUpdate(oldTenantId, { active: false });

    // 3) Nếu phòng không còn ai thì set empty (về lý thuyết vẫn còn người đại diện mới)
    const remaining = await Tenant.countDocuments({
      roomId: contract.roomId,
      active: true,
    });
    await Room.findByIdAndUpdate(contract.roomId, {
      status: remaining === 0 ? "empty" : "occupied",
    });

    const populated = await Contract.findById(contract._id)
      .populate("roomId", "roomNumber floor price")
      .populate("tenantId", "fullName phone");

    res.json({ message: "Đổi người đại diện thành công", contract: populated });
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
  transferRepresentative,
};