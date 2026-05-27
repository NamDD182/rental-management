const Invoice = require("../models/invoice");
const Contract = require("../models/contract");
const Room = require("../models/room");
const Tenant = require("../models/tenant");

// GET /api/invoices — danh sách hóa đơn
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("roomId", "roomNumber floor")
      .populate({
        path: "contractId",
        populate: [
          { path: "roomId",   select: "roomNumber floor" },
          { path: "tenantId", select: "fullName phone" },
        ],
      })
      .sort({ year: -1, month: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/invoices/:id — chi tiết 1 hóa đơn
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("roomId", "roomNumber floor price")
      .populate({
        path: "contractId",
        populate: { path: "tenantId", select: "fullName phone cccd" },
      });
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/invoices — tạo hóa đơn tháng
const createInvoice = async (req, res) => {
  try {
    const { contractId, month, year, electricOld, electricNew } = req.body;

    // Kiểm tra contract tồn tại và đang active
    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
    if (contract.status !== "active") {
      return res.status(400).json({ message: "Hợp đồng đã kết thúc" });
    }

    // Kiểm tra đã có hóa đơn tháng này chưa
    const existed = await Invoice.findOne({ contractId, month, year });
    if (existed) {
      return res.status(400).json({ message: `Đã có hóa đơn tháng ${month}/${year} rồi` });
    }

    // Đếm số người đang ở trong phòng
    const currentPeople = await Tenant.countDocuments({
      roomId: contract.roomId,
      active: true,
    });

    const invoice = await Invoice.create({
      ...req.body,
      contractId,
      roomId: contract.roomId,
      rentAmount: contract.rentPrice,
      currentPeople,
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/invoices/:id/pay — đánh dấu đã thanh toán
const payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn đã thanh toán rồi" });
    }

    invoice.status           = "paid";
    invoice.paidAt           = new Date();
    invoice.paymentMethod    = req.body.paymentMethod || "cash";
    invoice.transferImageUrl = req.body.transferImageUrl || null; // ← thêm
    await invoice.save();

    res.json({ message: "Thanh toán thành công", invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/invoices/:id — sửa hóa đơn
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn đã thanh toán, không thể sửa" });
    }

    // Dùng save() thay vì findByIdAndUpdate để pre-save hook chạy
    Object.assign(invoice, req.body);
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/invoices/:id — xóa hóa đơn chưa thanh toán
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn đã thanh toán, không thể xóa" });
    }

    await invoice.deleteOne();
    res.json({ message: "Xóa hóa đơn thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  payInvoice,
  deleteInvoice,
};