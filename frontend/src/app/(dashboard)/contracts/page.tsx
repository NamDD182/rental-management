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
import { Plus, FileText, Loader2, Search } from "lucide-react";

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  price: number;
  currentPeople: number;
  maxPeople: number;
  status: string;
}

interface Tenant {
  _id: string;
  fullName: string;
  phone: string;
  roomId: { _id: string; roomNumber: string };
}

interface Contract {
  _id: string;
  roomId: { _id: string; roomNumber: string; floor: number; price: number };
  tenantId: { _id: string; fullName: string; phone: string };
  startDate: string;
  endDate: string | null;
  rentPrice: number;
  deposit: number;
  status: "active" | "ended";
  note: string;
}

const statusConfig = {
  active: { label: "Đang thuê", class: "bg-emerald-100 text-emerald-700" },
  ended: { label: "Đã kết thúc", class: "bg-slate-100 text-slate-500" },
};

const defaultForm = {
  roomId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  rentPrice: "",
  deposit: "",
  note: "",
};

const selectClass =
  "w-full h-10 rounded-md border border-input px-3 text-sm bg-background text-foreground";

const formatDate = (dateStr: string | null) => {
  if (!dateStr || dateStr === "") return "Chưa xác định";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Chưa xác định";
  return date.toLocaleDateString("vi-VN");
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [selectedFloor, setSelectedFloor] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsRes, roomsRes, tenantsRes] = await Promise.all([
        api.get("/contracts"),
        api.get("/rooms"),
        api.get("/tenants"),
      ]);
      setContracts(contractsRes.data);
      setRooms(roomsRes.data);
      setTenants(tenantsRes.data);
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
    try {
      setSubmitting(true);
      setError("");
      await api.post("/contracts", {
        roomId: form.roomId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate !== "" ? form.endDate : null,
        rentPrice: Number(form.rentPrice),
        deposit: Number(form.deposit),
        note: form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      setSelectedFloor("");
      showToast("Tạo hợp đồng thành công!");
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndContract = async (contract: Contract) => {
    if (
      !confirm(
        `Xác nhận kết thúc hợp đồng phòng ${contract.roomId?.roomNumber}?`,
      )
    )
      return;
    try {
      await api.put(`/contracts/${contract._id}/end`, {
        endDate: new Date().toISOString(),
      });
      setSelectedContract(null);
      showToast("Kết thúc hợp đồng thành công!");
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Floors
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  // Filtered rooms theo tầng và còn chỗ
  const filteredRooms = rooms.filter(
    (r) =>
      r.currentPeople < r.maxPeople &&
      (selectedFloor ? r.floor === Number(selectedFloor) : true),
  );

  // Filtered tenants theo phòng đã chọn
  const filteredTenants = tenants.filter((t) =>
    form.roomId ? t.roomId?._id === form.roomId : true,
  );

  // Search + filter
  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.roomId?.roomNumber?.toString().includes(search) ||
      c.tenantId?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    return matchSearch && matchStatus;
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
          <h1 className="text-2xl font-semibold text-slate-800">Hợp đồng</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {contracts.filter((c) => c.status === "active").length} đang active
            • {contracts.length} tổng
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo hợp đồng
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo phòng hoặc tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-input px-3 text-sm bg-background w-40"
        >
          <option value="">Tất cả</option>
          <option value="active">Đang thuê</option>
          <option value="ended">Đã kết thúc</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p>Không tìm thấy hợp đồng nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => (
            <div
              key={contract._id}
              onClick={() => setSelectedContract(contract)}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Phòng {contract.roomId?.roomNumber} —{" "}
                      {contract.tenantId?.fullName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(contract.startDate)} →{" "}
                      {formatDate(contract.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-indigo-600 font-semibold text-sm">
                    {contract.rentPrice.toLocaleString("vi-VN")}đ/tháng
                  </p>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[contract.status].class}`}
                  >
                    {statusConfig[contract.status].label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tạo hợp đồng */}
      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          setOpenModal(open);
          if (!open) {
            setForm(defaultForm);
            setSelectedFloor("");
            setError("");
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="rounded-2xl max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Tầng + Phòng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setForm({ ...form, roomId: "", tenantId: "" });
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
                <Label>Phòng</Label>
                <select
                  value={form.roomId}
                  onChange={(e) => {
                    const room = rooms.find((r) => r._id === e.target.value);
                    setForm({
                      ...form,
                      roomId: e.target.value,
                      rentPrice: String(room?.price || ""),
                    });
                  }}
                  className={selectClass}
                  required
                >
                  <option value="">Chọn phòng</option>
                  {filteredRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khách thuê */}
            <div className="space-y-1.5">
              <Label>Khách thuê (người đại diện)</Label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">Chọn khách thuê</option>
                {filteredTenants.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fullName} — {t.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày bắt đầu + kết thúc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Giá thuê + tiền cọc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giá thuê (đ/tháng)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="2500000"
                  value={form.rentPrice}
                  onChange={(e) =>
                    setForm({ ...form, rentPrice: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tiền cọc</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="2500000"
                  value={form.deposit}
                  onChange={(e) =>
                    setForm({ ...form, deposit: e.target.value })
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
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">
                {error}
              </p>
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
                    Đang lưu...
                  </span>
                ) : (
                  "Tạo hợp đồng"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết hợp đồng */}
      <Dialog
        open={!!selectedContract}
        onOpenChange={(open) => {
          if (!open) setSelectedContract(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="rounded-2xl max-w-md"
        >
          <DialogHeader>
            <DialogTitle>
              Hợp đồng phòng {selectedContract?.roomId?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Khách thuê",
                    value: selectedContract.tenantId?.fullName,
                  },
                  {
                    label: "Số điện thoại",
                    value: selectedContract.tenantId?.phone,
                  },
                  {
                    label: "Ngày bắt đầu",
                    value: formatDate(selectedContract.startDate),
                  },
                  {
                    label: "Ngày kết thúc",
                    value: formatDate(selectedContract.endDate),
                  },
                  {
                    label: "Giá thuê",
                    value: `${selectedContract.rentPrice.toLocaleString("vi-VN")}đ/tháng`,
                  },
                  {
                    label: "Tiền cọc",
                    value: `${selectedContract.deposit.toLocaleString("vi-VN")}đ`,
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {selectedContract.note && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Ghi chú</p>
                  <p className="text-sm text-slate-800 mt-0.5">
                    {selectedContract.note}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedContract.status].class}`}
                >
                  {statusConfig[selectedContract.status].label}
                </span>
              </div>

              {selectedContract.status === "active" && (
                <Button
                  className="w-full border-red-200 text-red-500 hover:bg-red-50"
                  variant="outline"
                  onClick={() => handleEndContract(selectedContract)}
                >
                  Kết thúc hợp đồng
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
