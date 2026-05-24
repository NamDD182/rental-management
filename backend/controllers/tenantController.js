const Tenant = require("../models/tenant");
const Room = require("../models/room");

// GET /tenants - danh sach khach dang thue (active = true)
const getAllTenants = async(req, res) => {
    try{
        const tenants = await Tenant.find({active : true})
            .populate("roomId", "roomNumber floor price")
            .sort({ createdAt: -1});
        res.json(tenants);
    } catch (error){
        res.status(500).json({message: error.message});
    }
}

// GET /tenants/:id - chi tiet 1 khach
const getTenantById = async(req, res) => {
    try{
        const tenant = await Tenant.findById(req.params.id)
            .populate("roomId", "roomNumber price");
        if(!tenant){
            return res.status(400).json({message: "Không tìm thấy khách thuê"});
        }
        res.json(tenant);
    }catch (error){
        res.status(500).json({message: error.message});
    }
}

// POST /tenants — thêm khách mới
const createTenant = async (req, res) => {
  try {
    const { roomId, cccd } = req.body;

    // Kiểm tra phòng tồn tại không
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    // Kiểm tra CCCD đã tồn tại chưa
    const existed = await Tenant.findOne({ cccd });
    if (existed) return res.status(400).json({ message: "CCCD đã tồn tại" });

    // Kiểm tra phòng còn chỗ không
    // Thay vì filter status !== "occupied"
    // Kiểm tra số người hiện tại < maxPeople
    const currentCount = await Tenant.countDocuments({ roomId: room._id, active: true });
    if (currentCount >= room.maxPeople) {
      return res.status(400).json({ message: `Phòng đã đủ ${room.maxPeople} người` });
    }

    // Chỉ set occupied khi đã đầy người
    if (currentCount + 1 >= room.maxPeople) {
      await Room.findByIdAndUpdate(roomId, { status: "occupied" });
    }

    const tenant = await Tenant.create(req.body);

    // Cập nhật status phòng thành occupied
    await Room.findByIdAndUpdate(roomId, { status: "occupied" });

    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /tenants/:id — sửa thông tin khách
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy khách thuê" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /tenants/:id — set active = false (không xóa cứng)
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Không tìm thấy khách thuê" });

    const roomId = tenant.roomId; // lưu lại trước khi set null

    // Set active = false
    tenant.active = false;
    tenant.roomId = null;
    await tenant.save();

    // Kiểm tra phòng còn ai không
    const remaining = await Tenant.countDocuments({ roomId, active: true });
    if (remaining === 0) {
      await Room.findByIdAndUpdate(roomId, { status: "empty" });
    }

    res.json({ message: "Đã xóa khách thuê thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant };