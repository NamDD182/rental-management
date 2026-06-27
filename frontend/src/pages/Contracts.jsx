import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Loader2, Search } from "lucide-react";
const statusConfig = {
  active: {
    label: "Đang thuê",
    class: "bg-emerald-100 text-emerald-700",
  },
  ended: {
    label: "Đã kết thúc",
    class: "bg-slate-100 text-slate-500",
  },
};
const defaultForm = {
  roomId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  rentPrice: "",
  deposit: "",
  contractFile: "",
  note: "",
};
const selectClass =
  "w-full h-10 rounded-md border border-input px-3 text-sm bg-background text-foreground";
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "") return "Chưa xác định";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Chưa xác định";
  return date.toLocaleDateString("vi-VN");
};
export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState("");

  // Modal gia hạn
  const [openRenewModal, setOpenRenewModal] = useState(false);
  const [renewForm, setRenewForm] = useState({
    startDate: "",
    endDate: "",
  });

  // Modal đổi người đại diện
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [transferTenantId, setTransferTenantId] = useState("");
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
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };
  const handleSubmit = async (e) => {
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
        contractFile: form.contractFile,
        note: form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      setSelectedFloor("");
      showToast("Tạo hợp đồng thành công!");
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };
  const handleEndContract = async (contract) => {
    if (!confirm(`Xác nhận kết thúc hợp đồng phòng ${contract.roomId?.roomNumber}?`)) return;
    try {
      await api.put(`/contracts/${contract._id}/end`, {
        endDate: new Date().toISOString(),
      });
      setSelectedContract(null);
      showToast("Kết thúc hợp đồng thành công!");
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      setUploadingFile(true);
      setError("");
      const res = await api.post("/upload/file", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setForm((f) => ({
        ...f,
        contractFile: res.data.url,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Upload file thất bại");
    } finally {
      setUploadingFile(false);
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (!transferTenantId) {
      setError("Vui lòng chọn người đại diện mới");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.put(`/contracts/${selectedContract._id}/transfer`, {
        newTenantId: transferTenantId,
      });
      setOpenTransferModal(false);
      setTransferTenantId("");
      setSelectedContract(null);
      showToast("Đổi người đại diện thành công!");
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenRenew = (contract) => {
    // Ngày bắt đầu mới = ngày kết thúc cũ + 1 ngày
    const oldEnd = contract.endDate ? new Date(contract.endDate) : new Date();
    oldEnd.setDate(oldEnd.getDate() + 1);
    setRenewForm({
      startDate: oldEnd.toISOString().slice(0, 10),
      endDate: "",
    });
    setOpenRenewModal(true);
    setError("");
  };
  const handleRenew = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (renewForm.startDate >= renewForm.endDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    try {
      setSubmitting(true);
      setError("");

      // Tạo contract MỚI thay vì update
      await api.post("/contracts", {
        roomId: selectedContract.roomId._id,
        tenantId: selectedContract.tenantId._id,
        startDate: renewForm.startDate,
        endDate: renewForm.endDate,
        rentPrice: selectedContract.rentPrice,
        deposit: selectedContract.deposit,
        note: selectedContract.note,
        isRenewal: true,
      });
      setOpenRenewModal(false);
      setRenewForm({
        startDate: "",
        endDate: "",
      });
      setSelectedContract(null);
      showToast("Gia hạn hợp đồng thành công!");
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Floors
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  // Phòng đang có hợp đồng active → không cho ký thêm (mỗi phòng 1 hợp đồng active)
  const activeContractRoomIds = new Set(
    contracts.filter((c) => c.status === "active").map((c) => c.roomId?._id),
  );

  // Hiện phòng chưa có hợp đồng active (kể cả phòng đã có khách ở nhưng chưa ký HĐ)
  const filteredRooms = rooms.filter(
    (r) =>
      !activeContractRoomIds.has(r._id) &&
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
            {contracts.filter((c) => c.status === "active").length} đang active • {contracts.length}{" "}
            tổng
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
                      Phòng {contract.roomId?.roomNumber} — {contract.tenantId?.fullName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
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
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setForm({
                      ...form,
                      roomId: "",
                      tenantId: "",
                    });
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

            <div className="space-y-1.5">
              <Label>Khách thuê (người đại diện)</Label>
              <select
                value={form.tenantId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tenantId: e.target.value,
                  })
                }
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startDate: e.target.value,
                    })
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
                    setForm({
                      ...form,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giá thuê (đ/tháng)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="2500000"
                  value={form.rentPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rentPrice: e.target.value,
                    })
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
                    setForm({
                      ...form,
                      deposit: e.target.value,
                    })
                  }
                />
              </div>
            </div>

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

            <div className="space-y-1.5">
              <Label>File hợp đồng (ảnh hoặc PDF)</Label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-600 file:text-sm hover:file:bg-indigo-100"
              />
              {uploadingFile && <p className="text-xs text-slate-400">Đang tải file lên...</p>}
              {form.contractFile && !uploadingFile && (
                <a
                  href={form.contractFile}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 underline"
                >
                  Đã tải lên — xem file
                </a>
              )}
            </div>

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
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Hợp đồng phòng {selectedContract?.roomId?.roomNumber}</DialogTitle>
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
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedContract.note && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Ghi chú</p>
                  <p className="text-sm text-slate-800 mt-0.5">{selectedContract.note}</p>
                </div>
              )}

              {selectedContract.contractFile && (
                <a
                  href={selectedContract.contractFile}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl p-3 text-sm font-medium hover:bg-indigo-100 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  Xem file hợp đồng
                </a>
              )}

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedContract.status].class}`}
                >
                  {statusConfig[selectedContract.status].label}
                </span>
              </div>

              {selectedContract.status === "active" && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => {
                      setTransferTenantId("");
                      setError("");
                      setOpenTransferModal(true);
                    }}
                  >
                    Đổi người đại diện
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      onClick={() => handleOpenRenew(selectedContract)}
                    >
                      Gia hạn
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-500 hover:bg-red-50"
                      onClick={() => handleEndContract(selectedContract)}
                    >
                      Kết thúc
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal gia hạn hợp đồng */}
      <Dialog
        open={openRenewModal}
        onOpenChange={(open) => {
          setOpenRenewModal(open);
          if (!open) {
            setError("");
            setRenewForm({
              startDate: "",
              endDate: "",
            });
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Gia hạn hợp đồng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenew} className="space-y-4 mt-2">
            {/* Thông tin hợp đồng cũ */}
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-500">
              Hợp đồng cũ kết thúc:{" "}
              <span className="font-medium text-slate-700">
                {selectedContract?.endDate
                  ? new Date(selectedContract.endDate).toLocaleDateString("vi-VN")
                  : "Chưa xác định"}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label>Ngày bắt đầu mới</Label>
              <Input
                type="date"
                value={renewForm.startDate}
                onChange={(e) =>
                  setRenewForm({
                    ...renewForm,
                    startDate: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ngày kết thúc mới</Label>
              <Input
                type="date"
                value={renewForm.endDate}
                onChange={(e) =>
                  setRenewForm({
                    ...renewForm,
                    endDate: e.target.value,
                  })
                }
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpenRenewModal(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Gia hạn"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal đổi người đại diện */}
      <Dialog
        open={openTransferModal}
        onOpenChange={(open) => {
          setOpenTransferModal(open);
          if (!open) {
            setError("");
            setTransferTenantId("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi người đại diện</DialogTitle>
          </DialogHeader>
          {(() => {
            const roomMates = tenants.filter(
              (t) =>
                t.roomId?._id === selectedContract?.roomId?._id &&
                t._id !== selectedContract?.tenantId?._id,
            );
            return (
              <form onSubmit={handleTransfer} className="space-y-4 mt-2">
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-500">
                  Đại diện hiện tại:{" "}
                  <span className="font-medium text-slate-700">
                    {selectedContract?.tenantId?.fullName}
                  </span>
                </div>

                {roomMates.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                    Phòng này không còn khách nào khác đang ở. Hãy thêm khách vào phòng trước, hoặc
                    dùng “Kết thúc” nếu cả phòng dọn đi.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Người đại diện mới</Label>
                    <select
                      value={transferTenantId}
                      onChange={(e) => setTransferTenantId(e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Chọn khách trong phòng</option>
                      {roomMates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.fullName} — {t.phone}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400">
                      Người đại diện cũ sẽ được gỡ khỏi phòng. Hợp đồng và hóa đơn vẫn giữ nguyên.
                    </p>
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
                    onClick={() => setOpenTransferModal(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={submitting || roomMates.length === 0}
                  >
                    {submitting ? "Đang lưu..." : "Xác nhận"}
                  </Button>
                </div>
              </form>
            );
          })()}
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
