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
import { Plus, Users, Loader2, Phone, CreditCard, Search } from "lucide-react";

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  status: string;
  currentPeople: number;
  maxPeople: number;
}

interface Tenant {
  _id: string;
  fullName: string;
  phone: string;
  cccd: string;
  cccdDate: string;
  cccdPlace: string;
  dob: string;
  hometown: string;
  gender: "male" | "female";
  roomId: Room;
  vehicleNumber: string;
  tempResidenceCode: string;
  emergencyName: string;
  emergencyPhone: string;
  note: string;
  active: boolean;
}

const defaultForm = {
  fullName: "",
  phone: "",
  cccd: "",
  cccdDate: "",
  cccdPlace: "",
  dob: "",
  hometown: "",
  gender: "male",
  roomId: "",
  vehicleNumber: "",
  tempResidenceCode: "",
  emergencyName: "",
  emergencyPhone: "",
  note: "",
};

const selectClass = "w-full h-10 rounded-md border border-input px-3 text-sm bg-background text-foreground";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // Modal thêm
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");

  // Modal chi tiết
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Modal sửa
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState(defaultForm);

  const [filterFloor, setFilterFloor] = useState("");
  const [filterRoom, setFilterRoom] = useState("");

  useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    const [tenantsRes, roomsRes] = await Promise.all([
      api.get("/tenants"),
      api.get("/rooms"),
    ]);
    console.log("tenants:", tenantsRes.data); // ← thêm dòng này
    setTenants(tenantsRes.data);
    setRooms(roomsRes.data);
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
      await api.post("/tenants", form);
      setOpenModal(false);
      setForm(defaultForm);
      setSelectedFloor("");
      showToast("Thêm khách thuê thành công!");
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      setError(msg.includes("cccd") ? "CCCD đã tồn tại trong hệ thống" : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (tenant: Tenant) => {
    setEditForm({
      fullName:      tenant.fullName,
      phone:         tenant.phone,
      cccd:          tenant.cccd,
      cccdDate:      tenant.cccdDate ? tenant.cccdDate.slice(0, 10) : "",
      cccdPlace:     tenant.cccdPlace || "",
      dob:           tenant.dob ? tenant.dob.slice(0, 10) : "",
      hometown:      tenant.hometown || "",
      gender:        tenant.gender,
      roomId:        tenant.roomId?._id || "",
      vehicleNumber: tenant.vehicleNumber || "",
      tempResidenceCode: tenant.tempResidenceCode || "",
      emergencyName:     tenant.emergencyName || "",
      emergencyPhone:    tenant.emergencyPhone || "",
      note:          tenant.note || "",
    });
    setOpenEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      setSubmitting(true);
      setError("");
      await api.put(`/tenants/${selectedTenant._id}`, editForm);
      setOpenEditModal(false);
      setSelectedTenant(null);
      showToast("Cập nhật thông tin thành công!");
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (tenant: Tenant) => {
  if (!confirm(`Xác nhận ${tenant.fullName} chuyển đi?`)) return;
  try {
    await api.delete(`/tenants/${tenant._id}`);
    setSelectedTenant(null);
    showToast(`${tenant.fullName} đã chuyển đi!`);
    fetchData();
  } catch (err: any) {
    alert(err?.response?.data?.message || "Có lỗi xảy ra");
  }
};

  // Floors + filtered rooms
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
  const filteredRooms = rooms.filter(
  (r) =>
    // Còn chỗ trống (số người < tối đa), hoặc là phòng đang chọn (cho trường hợp sửa)
    (r.currentPeople < r.maxPeople || r._id === form.roomId) &&
    (selectedFloor ? r.floor === Number(selectedFloor) : true)
);

  // Search
  const filtered = tenants.filter((t) => {
  const matchSearch = t.fullName.toLowerCase().includes(search.toLowerCase());
  const matchFloor  = filterFloor ? t.roomId?.floor === Number(filterFloor) : true;
  const matchRoom   = filterRoom  ? t.roomId?._id === filterRoom : true;
  return matchSearch && matchFloor && matchRoom;
});

const roomsForFilter = rooms.filter((r) =>
  filterFloor ? r.floor === Number(filterFloor) : true
);

  // Group theo tầng
  const tenantFloors = [...new Set(
    filtered.map((t) => t.roomId?.floor).filter(Boolean)
  )].sort((a, b) => a - b);

  const groupedByFloor = tenantFloors.reduce((acc, floor) => {
    acc[floor] = filtered.filter((t) => t.roomId?.floor === floor);
    return acc;
  }, {} as Record<number, Tenant[]>);

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
          <h1 className="text-2xl font-semibold text-slate-800">Khách thuê</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {tenants.length} khách đang thuê
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm khách
        </Button>
      </div>

      {/* Search + Filter */}
<div className="flex gap-3 mb-6 flex-wrap">
  <div className="relative flex-1 min-w-[200px] max-w-xs">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input
      placeholder="Tìm tên khách..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-9 w-full h-10"
    />
  </div>

  <select
    value={filterFloor}
    onChange={(e) => {
      setFilterFloor(e.target.value);
      setFilterRoom(""); // reset phòng khi đổi tầng
    }}
    className="h-10 rounded-md border border-input px-3 text-sm bg-background"
  >
    <option value="">Tất cả tầng</option>
    {floors.map((f) => (
      <option key={f} value={f}>Tầng {f}</option>
    ))}
  </select>

  <select
    value={filterRoom}
    onChange={(e) => setFilterRoom(e.target.value)}
    className="h-10 rounded-md border border-input px-3 text-sm bg-background"
  >
    <option value="">Tất cả phòng</option>
    {roomsForFilter.map((r) => (
      <option key={r._id} value={r._id}>
        Phòng {r.roomNumber}
      </option>
    ))}
  </select>
</div>

      {/* Group by floor */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Users className="h-12 w-12 mb-3 opacity-30" />
          <p>Không tìm thấy khách nào</p>
        </div>
      ) : (
        tenantFloors.map((floor) => (
          <div key={floor} className="mb-8">
            {/* Floor header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-slate-600">Tầng {floor}</h2>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">
                {groupedByFloor[floor].length} khách
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedByFloor[floor].map((tenant) => (
                <div
                  key={tenant._id}
                  onClick={() => setSelectedTenant(tenant)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-indigo-600">
                        {tenant.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{tenant.fullName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Phòng {tenant.roomId?.roomNumber ?? "—"}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      tenant.gender === "male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                    }`}>
                      {tenant.gender === "male" ? "Nam" : "Nữ"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="h-4 w-4 text-slate-300" />
                      {tenant.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CreditCard className="h-4 w-4 text-slate-300" />
                      {tenant.cccd}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal thêm khách */}
      <Dialog open={openModal} onOpenChange={(open) => {
        setOpenModal(open);
        if (!open) { setForm(defaultForm); setSelectedFloor(""); setError(""); }
      }}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm khách thuê</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Họ tên</Label>
              <Input placeholder="Nguyễn Văn A" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input placeholder="0912345678" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <select value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={selectClass}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CCCD</Label>
                <Input placeholder="001234567890" value={form.cccd}
                  onChange={(e) => setForm({ ...form, cccd: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày cấp</Label>
                <Input type="date" value={form.cccdDate}
                  onChange={(e) => setForm({ ...form, cccdDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nơi cấp CCCD</Label>
              <Input placeholder="Cục CSQL HCCD - CA TP Hà Nội" value={form.cccdPlace}
                onChange={(e) => setForm({ ...form, cccdPlace: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày sinh</Label>
                <Input type="date" value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quê quán</Label>
                <Input placeholder="Nam Định" value={form.hometown}
                  onChange={(e) => setForm({ ...form, hometown: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <select value={selectedFloor}
                  onChange={(e) => { setSelectedFloor(e.target.value); setForm({ ...form, roomId: "" }); }}
                  className={selectClass}>
                  <option value="">Tất cả tầng</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>Tầng {f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Phòng</Label>
                <select value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className={selectClass} required>
                  <option value="">Chọn phòng</option>
                  {filteredRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.roomNumber} ({r.currentPeople}/{r.maxPeople})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Biển số xe</Label>
                <Input placeholder="30A-12345" value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Mã tạm trú</Label>
                <Input placeholder="..." value={form.tempResidenceCode}
                  onChange={(e) => setForm({ ...form, tempResidenceCode: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Người liên hệ khẩn cấp</Label>
                <Input placeholder="Họ tên người thân" value={form.emergencyName}
                  onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SĐT khẩn cấp</Label>
                <Input placeholder="0912345678" value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input placeholder="..." value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenModal(false)}>
                Hủy
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Đang lưu...
                  </span>
                ) : "Thêm khách"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết */}
      <Dialog open={!!selectedTenant} onOpenChange={(open) => {
        if (!open) { setSelectedTenant(null); setError(""); }
      }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTenant?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-indigo-600">
                    {selectedTenant.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedTenant.fullName}</p>
                  <p className="text-sm text-slate-400">
                    Phòng {selectedTenant.roomId?.roomNumber ?? "—"} •{" "}
                    {selectedTenant.gender === "male" ? "Nam" : "Nữ"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Số điện thoại", value: selectedTenant.phone },
                  { label: "CCCD",          value: selectedTenant.cccd },
                  { label: "Ngày cấp",      value: formatDate(selectedTenant.cccdDate) },
                  { label: "Nơi cấp",       value: selectedTenant.cccdPlace || "—" },
                  { label: "Ngày sinh",     value: formatDate(selectedTenant.dob) },
                  { label: "Quê quán",      value: selectedTenant.hometown || "—" },
                  { label: "Biển số xe",    value: selectedTenant.vehicleNumber || "—" },
                  { label: "Mã tạm trú",    value: selectedTenant.tempResidenceCode || "—" },
                  { label: "LH khẩn cấp",   value: selectedTenant.emergencyName || "—" },
                  { label: "SĐT khẩn cấp",  value: selectedTenant.emergencyPhone || "—" },
                  { label: "Ghi chú",       value: selectedTenant.note || "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleOpenEdit(selectedTenant)}
              >
                Sửa thông tin
              </Button>

              <Button
    variant="outline"
    className="flex-1 border-red-200 text-red-500 hover:bg-red-50"
    onClick={() => handleCheckout(selectedTenant)}
  >
    Chuyển đi
  </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal sửa */}
      <Dialog open={openEditModal} onOpenChange={(open) => {
        setOpenEditModal(open);
        if (!open) setError("");
      }}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa thông tin khách</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Họ tên</Label>
              <Input value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <select value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className={selectClass}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CCCD</Label>
                <Input value={editForm.cccd}
                  onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày cấp</Label>
                <Input type="date" value={editForm.cccdDate}
                  onChange={(e) => setEditForm({ ...editForm, cccdDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nơi cấp CCCD</Label>
              <Input value={editForm.cccdPlace}
                onChange={(e) => setEditForm({ ...editForm, cccdPlace: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày sinh</Label>
                <Input type="date" value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quê quán</Label>
                <Input value={editForm.hometown}
                  onChange={(e) => setEditForm({ ...editForm, hometown: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Biển số xe</Label>
                <Input value={editForm.vehicleNumber}
                  onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Mã tạm trú</Label>
                <Input value={editForm.tempResidenceCode}
                  onChange={(e) => setEditForm({ ...editForm, tempResidenceCode: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Người liên hệ khẩn cấp</Label>
                <Input value={editForm.emergencyName}
                  onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SĐT khẩn cấp</Label>
                <Input value={editForm.emergencyPhone}
                  onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setOpenEditModal(false)}>
                Hủy
              </Button>
              <Button type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Đang lưu...
                  </span>
                ) : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
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