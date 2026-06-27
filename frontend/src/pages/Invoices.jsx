import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Receipt, Loader2, Search } from "lucide-react";
const statusConfig = {
  unpaid: {
    label: "Chưa thu",
    class: "bg-amber-100 text-amber-700",
  },
  paid: {
    label: "Đã thu",
    class: "bg-emerald-100 text-emerald-700",
  },
  overdue: {
    label: "Quá hạn",
    class: "bg-red-100 text-red-600",
  },
};
const paymentMethodLabel = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  qr: "QR Code",
};
const defaultForm = {
  contractId: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  electricOld: "",
  electricNew: "",
  electricPrice: "3500",
  serviceAmount: "150000",
  vehicleFee: "0",
  note: "",
};
const selectClass =
  "w-full h-10 rounded-md border border-input px-3 text-sm bg-background text-foreground";
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Modal tạo
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractPeople, setContractPeople] = useState(0);

  // Modal chi tiết
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Modal thanh toán
  const [openPayModal, setOpenPayModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transferImage, setTransferImage] = useState(null);
  const [transferPreview, setTransferPreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewImage, setViewImage] = useState("");
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [invoicesRes, contractsRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/contracts"),
      ]);
      setInvoices(invoicesRes.data);
      setContracts(contractsRes.data.filter((c) => c.status === "active"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };
  const handleSelectContract = async (contractId) => {
    setForm((f) => ({
      ...f,
      contractId,
    }));
    const contract = contracts.find((c) => c._id === contractId) || null;
    setSelectedContract(contract);
    if (contract) {
      try {
        const res = await api.get(`/rooms/${contract.roomId._id}/tenants`);
        setContractPeople(res.data.length);
      } catch {
        setContractPeople(0);
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.electricNew) < Number(form.electricOld)) {
      setError("Chỉ số điện mới phải lớn hơn chỉ số cũ");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.post("/invoices", {
        contractId: form.contractId,
        month: Number(form.month),
        year: Number(form.year),
        electricOld: Number(form.electricOld),
        electricNew: Number(form.electricNew),
        electricPrice: Number(form.electricPrice),
        serviceAmount: Number(form.serviceAmount || 150000),
        vehicleFee: Number(form.vehicleFee || 0),
        note: form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      setSelectedFloor("");
      setSelectedContract(null);
      setContractPeople(0);
      showToast("Tạo hóa đơn thành công!");
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      setError(msg.includes("duplicate") ? "Hóa đơn tháng này đã tồn tại" : msg);
    } finally {
      setSubmitting(false);
    }
  };
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;
    try {
      setSubmitting(true);
      let transferImageUrl = null;

      // Upload ảnh nếu có
      if (paymentMethod === "bank_transfer" && transferImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", transferImage);
        const uploadRes = await api.post("/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        transferImageUrl = uploadRes.data.url;
        setUploadingImage(false);
      }
      await api.put(`/invoices/${payingInvoice._id}/pay`, {
        paymentMethod,
        transferImageUrl,
      });
      setOpenPayModal(false);
      setPayingInvoice(null);
      setSelectedInvoice(null);
      setTransferImage(null);
      setTransferPreview("");
      setPaymentMethod("cash");
      showToast("Đã thu tiền thành công!");
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  // Preview tổng tiền
  const previewTotal =
    (selectedContract?.rentPrice || 0) +
    (Number(form.electricNew) - Number(form.electricOld)) * Number(form.electricPrice) +
    contractPeople * 50000 +
    Number(form.serviceAmount || 150000) +
    Number(form.vehicleFee || 0);

  // Floors từ contracts active
  const floors = [...new Set(contracts.map((c) => c.roomId?.floor).filter(Boolean))].sort(
    (a, b) => a - b,
  );

  // Filter contracts theo tầng
  const filteredContracts = contracts.filter((c) =>
    selectedFloor ? c.roomId?.floor === Number(selectedFloor) : true,
  );

  // Tháng unique để filter
  const months = [...new Set(invoices.map((i) => `${i.month}/${i.year}`))];

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.contractId?.roomId?.roomNumber?.toString().includes(search) ||
      inv.contractId?.tenantId?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? inv.status === filterStatus : true;
    const matchMonth = filterMonth ? `${inv.month}/${inv.year}` === filterMonth : true;
    return matchSearch && matchStatus && matchMonth;
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    );
  }
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Hóa đơn</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length} chưa
            thu • {invoices.length} tổng
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo hóa đơn
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo phòng hoặc tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-10 rounded-md border border-input px-3 text-sm bg-background w-36"
        >
          <option value="">Tất cả tháng</option>
          {months.map((m) => (
            <option key={m} value={m}>
              Tháng {m}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-input px-3 text-sm bg-background w-36"
        >
          <option value="">Tất cả</option>
          <option value="unpaid">Chưa thu</option>
          <option value="paid">Đã thu</option>
          <option value="overdue">Quá hạn</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Receipt className="h-12 w-12 mb-3 opacity-30" />
          <p>Không tìm thấy hóa đơn nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <div
              key={invoice._id}
              onClick={() => setSelectedInvoice(invoice)}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Phòng {invoice.contractId?.roomId?.roomNumber} — Tháng {invoice.month}/
                      {invoice.year}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {invoice.contractId?.tenantId?.fullName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-indigo-600 font-semibold">
                    {invoice.totalAmount.toLocaleString("vi-VN")}đ
                  </p>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[invoice.status].class}`}
                  >
                    {statusConfig[invoice.status].label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tạo hóa đơn */}
      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          setOpenModal(open);
          if (!open) {
            setForm(defaultForm);
            setSelectedFloor("");
            setSelectedContract(null);
            setContractPeople(0);
            setError("");
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn tháng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Tầng + Hợp đồng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setForm({
                      ...form,
                      contractId: "",
                    });
                    setSelectedContract(null);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả tầng</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>
                      Tầng {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Phòng / Hợp đồng</Label>
                <select
                  value={form.contractId}
                  onChange={(e) => handleSelectContract(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Chọn phòng</option>
                  {filteredContracts.map((c) => (
                    <option key={c._id} value={c._id}>
                      Phòng {c.roomId?.roomNumber} — {c.tenantId?.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tháng + Năm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tháng</Label>
                <select
                  value={form.month}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      month: e.target.value,
                    })
                  }
                  className={selectClass}
                >
                  {Array.from(
                    {
                      length: 12,
                    },
                    (_, i) => i + 1,
                  ).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Năm</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      year: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Điện */}
            <div className="space-y-2">
              <Label>Chỉ số điện</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Chỉ số cũ</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="100"
                    value={form.electricOld}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        electricOld: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Chỉ số mới</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="250"
                    value={form.electricNew}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        electricNew: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Đơn giá (đ/kWh)</p>
                  <Input
                    type="number"
                    min={1}
                    value={form.electricPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        electricPrice: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phí dịch vụ + Phí xe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phí dịch vụ</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="150000"
                  value={form.serviceAmount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      serviceAmount: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phí xe</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.vehicleFee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vehicleFee: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                placeholder="..."
                value={form.note}
                onChange={(e) =>
                  setForm({
                    ...form,
                    note: e.target.value,
                  })
                }
              />
            </div>

            {/* Preview tổng tiền */}
            {selectedContract && form.electricOld !== "" && form.electricNew !== "" && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 mb-2">Dự tính hóa đơn</p>
                {[
                  {
                    label: "Tiền phòng",
                    value: selectedContract.rentPrice,
                  },
                  {
                    label: "Tiền điện",
                    value:
                      (Number(form.electricNew) - Number(form.electricOld)) *
                      Number(form.electricPrice),
                  },
                  {
                    label: `Tiền nước (${contractPeople} người)`,
                    value: contractPeople * 50000,
                  },
                  {
                    label: "Phí dịch vụ",
                    value: Number(form.serviceAmount || 150000),
                  },
                  {
                    label: "Phí xe",
                    value: Number(form.vehicleFee || 0),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-700">
                      {item.value.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
                <div className="border-t border-indigo-200 pt-2 flex justify-between font-semibold">
                  <span className="text-slate-800">Tổng</span>
                  <span className="text-indigo-600">{previewTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpenModal(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </span>
                ) : (
                  "Tạo hóa đơn"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết hóa đơn */}
      <Dialog
        open={!!selectedInvoice && !viewImage}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      >
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              Hóa đơn tháng {selectedInvoice?.month}/{selectedInvoice?.year} — Phòng{" "}
              {selectedInvoice?.contractId?.roomId?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-2">
              {/* Chi tiết từng khoản */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                {[
                  {
                    label: "Tiền phòng",
                    value: selectedInvoice.rentAmount,
                  },
                  {
                    label: `Điện (${selectedInvoice.electricNew - selectedInvoice.electricOld} kWh × ${selectedInvoice.electricPrice.toLocaleString("vi-VN")}đ)`,
                    value: selectedInvoice.electricAmount,
                  },
                  {
                    label: `Nước (${selectedInvoice.currentPeople} người × ${selectedInvoice.waterPerPerson.toLocaleString("vi-VN")}đ)`,
                    value: selectedInvoice.waterAmount,
                  },
                  {
                    label: "Phí dịch vụ",
                    value: selectedInvoice.serviceAmount,
                  },
                  {
                    label: "Phí xe",
                    value: selectedInvoice.vehicleFee || 0,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm gap-4">
                    <span className="text-slate-500 whitespace-nowrap">{item.label}</span>
                    <span className="font-medium text-slate-700 whitespace-nowrap">
                      {item.value.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span className="text-slate-800">Tổng cộng</span>
                  <span className="text-indigo-600 text-lg">
                    {selectedInvoice.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Trạng thái + phương thức */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedInvoice.status].class}`}
                >
                  {statusConfig[selectedInvoice.status].label}
                </span>
                {selectedInvoice.paymentMethod && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                    {paymentMethodLabel[selectedInvoice.paymentMethod]}
                  </span>
                )}
                {selectedInvoice.paidAt && (
                  <span className="text-xs text-slate-400">
                    {new Date(selectedInvoice.paidAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              {/* Ảnh chuyển khoản — nằm dưới, chiều rộng vừa phải */}
              {selectedInvoice.transferImageUrl && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">Ảnh chuyển khoản</p>
                  <img
                    src={selectedInvoice.transferImageUrl}
                    className="w-full max-h-52 rounded-xl object-contain border border-slate-100 bg-slate-50 cursor-zoom-in hover:opacity-90 transition-opacity"
                    alt="Ảnh chuyển khoản"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewImage(selectedInvoice.transferImageUrl);
                    }}
                  />
                </div>
              )}

              {selectedInvoice.note && (
                <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                  {selectedInvoice.note}
                </p>
              )}

              {selectedInvoice.status !== "paid" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setPayingInvoice(selectedInvoice);
                    setOpenPayModal(true);
                  }}
                >
                  Thu tiền
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận thanh toán */}
      <Dialog
        open={openPayModal}
        onOpenChange={(open) => {
          setOpenPayModal(open);
          if (!open) {
            setPaymentMethod("cash");
            setTransferImage(null);
            setTransferPreview("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận thu tiền</DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <form onSubmit={handlePay} className="space-y-4 mt-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phòng</span>
                  <span className="font-medium">
                    {payingInvoice.contractId?.roomId?.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tháng</span>
                  <span className="font-medium">
                    {payingInvoice.month}/{payingInvoice.year}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Khách thuê</span>
                  <span className="font-medium">
                    {payingInvoice.contractId?.tenantId?.fullName}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span className="text-slate-700">Tổng tiền</span>
                  <span className="text-indigo-600">
                    {payingInvoice.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Phương thức thanh toán</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "cash",
                      label: "Tiền mặt",
                    },
                    {
                      value: "bank_transfer",
                      label: "Chuyển khoản",
                    },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.value);
                        if (m.value === "cash") {
                          setTransferImage(null);
                          setTransferPreview("");
                        }
                      }}
                      className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all ${paymentMethod === m.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Upload ảnh chuyển khoản */}
                {paymentMethod === "bank_transfer" && (
                  <div
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${transferPreview ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) {
                        setTransferImage(file);
                        setTransferPreview(URL.createObjectURL(file));
                      }
                    }}
                    onClick={() => document.getElementById("transfer-upload")?.click()}
                  >
                    {transferPreview ? (
                      <div className="space-y-2">
                        <img
                          src={transferPreview}
                          className="max-h-40 mx-auto rounded-lg object-contain"
                          alt="Ảnh chuyển khoản"
                        />
                        <p className="text-xs text-slate-400">Click để đổi ảnh</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <p className="text-sm font-medium text-slate-500">
                          Kéo thả hoặc click để upload
                        </p>
                        <p className="text-xs text-slate-300">
                          Ảnh xác nhận chuyển khoản • PNG, JPG tối đa 5MB
                        </p>
                      </div>
                    )}
                    <input
                      id="transfer-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTransferImage(file);
                          setTransferPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpenPayModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={submitting}
                >
                  {uploadingImage
                    ? "Đang upload ảnh..."
                    : submitting
                      ? "Đang xử lý..."
                      : "Xác nhận thu"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {viewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setViewImage("")}
        >
          <img
            src={viewImage}
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            alt="Ảnh chuyển khoản"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-sm bg-black/40 px-3 py-1.5 rounded-lg"
            onClick={() => setViewImage("")}
          >
            ✕ Đóng
          </button>
        </div>
      )}
    </div>
  );
}
