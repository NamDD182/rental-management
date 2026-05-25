"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Receipt, Loader2, Search } from "lucide-react";

interface Contract {
  _id: string;
  roomId: { _id: string; roomNumber: string; floor: number };
  tenantId: { _id: string; fullName: string };
  rentPrice: number;
  status: string;
}

interface Invoice {
  _id: string;
  contractId: {
    _id: string;
    roomId: { roomNumber: string };
    tenantId: { fullName: string };
  };
  roomId: { roomNumber: string };
  month: number;
  year: number;
  rentAmount: number;
  electricOld: number;
  electricNew: number;
  electricPrice: number;
  electricAmount: number;
  currentPeople: number;
  waterPerPerson: number;
  waterAmount: number;
  serviceAmount: number;
  totalAmount: number;
  status: "unpaid" | "paid" | "overdue";
  paidAt: string | null;
  note: string;
}

const statusConfig = {
  unpaid:  { label: "Chưa thu",   class: "bg-amber-100 text-amber-700" },
  paid:    { label: "Đã thu",     class: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Quá hạn",   class: "bg-red-100 text-red-600" },
};

const defaultForm = {
  contractId:   "",
  month:        String(new Date().getMonth() + 1),
  year:         String(new Date().getFullYear()),
  electricOld:  "",
  electricNew:  "",
  electricPrice: "3500",
  note:         "",
};

const selectClass = "w-full h-10 rounded-md border border-input px-3 text-sm bg-background text-foreground";

export default function InvoicesPage() {
  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth,  setFilterMonth]  = useState("");

  const [openModal,  setOpenModal]  = useState(false);
  const [form,       setForm]       = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedFloor,   setSelectedFloor]   = useState("");

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
      setContracts(contractsRes.data.filter((c: Contract) => c.status === "active"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.electricNew) < Number(form.electricOld)) {
      setError("Chỉ số điện mới phải lớn hơn chỉ số cũ");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.post("/invoices", {
        contractId:   form.contractId,
        month:        Number(form.month),
        year:         Number(form.year),
        electricOld:  Number(form.electricOld),
        electricNew:  Number(form.electricNew),
        electricPrice: Number(form.electricPrice),
        note:         form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      setSelectedFloor("");
      showToast("Tạo hóa đơn thành công!");
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      setError(msg.includes("duplicate") ? "Hóa đơn tháng này đã tồn tại" : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (invoice: Invoice) => {
    if (!confirm(`Xác nhận đã thu tiền hóa đơn tháng ${invoice.month}/${invoice.year}?`)) return;
    try {
      await api.put(`/invoices/${invoice._id}/pay`);
      setSelectedInvoice(null);
      showToast("Đã đánh dấu thanh toán!");
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Floors từ contracts active
  const floors = [...new Set(
    contracts.map((c) => c.roomId?.floor).filter(Boolean)
  )].sort((a, b) => a - b);

  // Filter contracts theo tầng
  const filteredContracts = contracts.filter((c) =>
    selectedFloor ? c.roomId?.floor === Number(selectedFloor) : true
  );

  // Tháng unique để filter
  const months = [...new Set(invoices.map((i) => `${i.month}/${i.year}`))];

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.contractId?.roomId?.roomNumber?.toString().includes(search) ||
      inv.contractId?.tenantId?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? inv.status === filterStatus : true;
    const matchMonth  = filterMonth  ? `${inv.month}/${inv.year}` === filterMonth : true;
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
            {invoices.filter((i) => i.status === "unpaid").length} chưa thu •{" "}
            {invoices.length} tổng
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
            <option key={m} value={m}>Tháng {m}</option>
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
                      Phòng {invoice.contractId?.roomId?.roomNumber} — Tháng {invoice.month}/{invoice.year}
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
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[invoice.status].class}`}>
                    {statusConfig[invoice.status].label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tạo hóa đơn */}
      <Dialog open={openModal} onOpenChange={(open) => {
        setOpenModal(open);
        if (!open) { setForm(defaultForm); setSelectedFloor(""); setError(""); }
      }}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-lg">
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
                  onChange={(e) => { setSelectedFloor(e.target.value); setForm({ ...form, contractId: "" }); }}
                  className={selectClass}
                >
                  <option value="">Tất cả tầng</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>Tầng {f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Phòng / Hợp đồng</Label>
                <select
                  value={form.contractId}
                  onChange={(e) => setForm({ ...form, contractId: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  className={selectClass}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Năm</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
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
                    type="number" min={0}
                    placeholder="100"
                    value={form.electricOld}
                    onChange={(e) => setForm({ ...form, electricOld: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Chỉ số mới</p>
                  <Input
                    type="number" min={0}
                    placeholder="250"
                    value={form.electricNew}
                    onChange={(e) => setForm({ ...form, electricNew: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Đơn giá (đ/kWh)</p>
                  <Input
                    type="number" min={1}
                    value={form.electricPrice}
                    onChange={(e) => setForm({ ...form, electricPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Preview tiền điện */}
              {form.electricOld !== "" && form.electricNew !== "" && (
                <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-600">
                  Tiền điện:{" "}
                  <span className="font-semibold text-indigo-600">
                    {((Number(form.electricNew) - Number(form.electricOld)) * Number(form.electricPrice)).toLocaleString("vi-VN")}đ
                  </span>
                  {" "}({Number(form.electricNew) - Number(form.electricOld)} kWh × {Number(form.electricPrice).toLocaleString("vi-VN")}đ)
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                placeholder="..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setOpenModal(false)}>
                Hủy
              </Button>
              <Button type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Đang tạo...
                  </span>
                ) : "Tạo hóa đơn"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết hóa đơn */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              Hóa đơn tháng {selectedInvoice?.month}/{selectedInvoice?.year} — Phòng {selectedInvoice?.contractId?.roomId?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-2">
              {/* Chi tiết */}
              <div className="space-y-2">
                {[
                  { label: "Tiền phòng",   value: `${selectedInvoice.rentAmount.toLocaleString("vi-VN")}đ` },
                  { label: `Tiền điện (${selectedInvoice.electricNew - selectedInvoice.electricOld} kWh)`, value: `${selectedInvoice.electricAmount.toLocaleString("vi-VN")}đ` },
                  { label: `Tiền nước (${selectedInvoice.currentPeople} người)`, value: `${selectedInvoice.waterAmount.toLocaleString("vi-VN")}đ` },
                  { label: "Dịch vụ",      value: `${selectedInvoice.serviceAmount.toLocaleString("vi-VN")}đ` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-800">{item.value}</span>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="font-semibold text-slate-800">Tổng cộng</span>
                  <span className="font-bold text-indigo-600 text-lg">
                    {selectedInvoice.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedInvoice.status].class}`}>
                  {statusConfig[selectedInvoice.status].label}
                </span>
                {selectedInvoice.paidAt && (
                  <span className="text-xs text-slate-400">
                    {new Date(selectedInvoice.paidAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              {selectedInvoice.status !== "paid" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handlePay(selectedInvoice)}
                >
                  Đánh dấu đã thu tiền
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}