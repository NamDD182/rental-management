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
import { Plus, DoorOpen, Loader2, Search, Users } from "lucide-react";

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  area: number;
  price: number;
  maxPeople: number;
  currentPeople: number;
  status: "empty" | "occupied" | "maintenance";
  amenities: string[];
  note: string;
}

interface Tenant {
  _id: string;
  fullName: string;
  phone: string;
  cccd: string;
  gender: "male" | "female";
}

const statusConfig = {
  empty:       { label: "Còn trống", class: "bg-emerald-100 text-emerald-700" },
  occupied:    { label: "Đang thuê", class: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Bảo trì",   class: "bg-amber-100 text-amber-700" },
};

const defaultForm = {
  roomNumber: "",
  floor: "",
  area: "",
  price: "",
  maxPeople: "2",
  note: "",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal thêm phòng
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Modal chi tiết
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomTenants, setRoomTenants] = useState<Tenant[]>([]);
  const [roomHistory, setRoomHistory] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Modal sửa
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState(defaultForm);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickRoom = async (room: Room) => {
    setSelectedRoom(room);
    setLoadingTenants(true);
    setRoomHistory([]);
    try {
      const [tenantsRes, historyRes] = await Promise.all([
        api.get(`/rooms/${room._id}/tenants`),
        api.get(`/rooms/${room._id}/history`),
      ]);
      setRoomTenants(tenantsRes.data);
      setRoomHistory(historyRes.data);
    } catch {
      setRoomTenants([]);
      setRoomHistory([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.floor) < 1) return setError("Tầng phải lớn hơn 0");
    if (Number(form.maxPeople) < 1) return setError("Số người tối đa phải ít nhất 1");
    if (Number(form.area) <= 0) return setError("Diện tích phải lớn hơn 0");
    if (Number(form.price) <= 0) return setError("Giá thuê phải lớn hơn 0");

    try {
      setSubmitting(true);
      setError("");
      await api.post("/rooms", {
        roomNumber: form.roomNumber,
        floor:      Number(form.floor),
        area:       Number(form.area),
        price:      Number(form.price),
        maxPeople:  Number(form.maxPeople),
        note:       form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      fetchRooms();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      setError(msg.includes("roomNumber") ? "Số phòng đã tồn tại" : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (room: Room) => {
    setEditForm({
      roomNumber: String(room.roomNumber),
      floor:      String(room.floor),
      area:       String(room.area),
      price:      String(room.price),
      maxPeople:  String(room.maxPeople),
      note:       room.note || "",
    });
    setOpenEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      setSubmitting(true);
      setError("");
      await api.put(`/rooms/${selectedRoom._id}`, {
        roomNumber: editForm.roomNumber,
        floor:      Number(editForm.floor),
        area:       Number(editForm.area),
        price:      Number(editForm.price),
        maxPeople:  Number(editForm.maxPeople),
        note:       editForm.note,
      });
      setOpenEditModal(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Floors unique
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  // Filter
  const filtered = rooms.filter((r) =>
    String(r.roomNumber).toLowerCase().includes(search.toLowerCase())
  );

  // Group theo tầng + sort status
  const groupedByFloor = floors.reduce((acc, floor) => {
    acc[floor] = filtered
      .filter((r) => r.floor === floor)
      .sort((a, b) => {
        const order = { empty: 0, maintenance: 1, occupied: 2 };
        return order[a.status] - order[b.status];
      });
    return acc;
  }, {} as Record<number, typeof filtered>);

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
          <h1 className="text-2xl font-semibold text-slate-800">Phòng trọ</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Tổng {rooms.length} phòng •{" "}
            {rooms.filter((r) => r.status === "empty").length} còn trống
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm phòng
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm số phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Group by floor */}
      {floors.filter((floor) => groupedByFloor[floor]?.length > 0).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <DoorOpen className="h-12 w-12 mb-3 opacity-30" />
          <p>Không tìm thấy phòng nào</p>
        </div>
      ) : (
        floors
          .filter((floor) => groupedByFloor[floor]?.length > 0)
          .map((floor) => (
            <div key={floor} className="mb-8">
              {/* Floor header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-600">Tầng {floor}</h2>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">
                  {groupedByFloor[floor].filter((r) => r.status === "empty").length} trống /{" "}
                  {groupedByFloor[floor].length} phòng
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedByFloor[floor].map((room) => (
                  <div
                    key={room._id}
                    onClick={() => handleClickRoom(room)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-800">
                          Phòng {room.roomNumber}
                        </p>
                        <p className="text-xs text-slate-400">Tầng {room.floor}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[room.status].class}`}>
                        {statusConfig[room.status].label}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Diện tích</span>
                        <span className="text-slate-700 font-medium">{room.area} m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Số người</span>
                        <span className="text-slate-700 font-medium">
                          {room.currentPeople}/{room.maxPeople} người
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Giá thuê</span>
                        <span className="text-indigo-600 font-semibold">
                          {room.price.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}

      {/* Modal thêm phòng */}
      <Dialog open={openModal} onOpenChange={(open) => {
        setOpenModal(open);
        if (!open) { setForm(defaultForm); setError(""); }
      }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm phòng mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số phòng</Label>
                <Input
                  placeholder="101"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <Input
                  type="number" min={1} placeholder="1"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Diện tích (m²)</Label>
                <Input
                  type="number" min={1} placeholder="25"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số người tối đa</Label>
                <Input
                  type="number" min={1} max={3} placeholder="2"
                  value={form.maxPeople}
                  onChange={(e) => setForm({ ...form, maxPeople: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Giá thuê (đ/tháng)</Label>
              <Input
                type="number" min={1} placeholder="2500000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                placeholder="Có điều hòa, ban công..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
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
                ) : "Thêm phòng"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết phòng */}
      <Dialog open={!!selectedRoom} onOpenChange={(open) => { if (!open) { setSelectedRoom(null); setError(""); } }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Phòng {selectedRoom?.roomNumber}</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Tầng",      value: `Tầng ${selectedRoom.floor}` },
                  { label: "Diện tích", value: `${selectedRoom.area} m²` },
                  { label: "Giá thuê",  value: `${selectedRoom.price.toLocaleString("vi-VN")}đ` },
                  { label: "Số người",  value: `${selectedRoom.currentPeople}/${selectedRoom.maxPeople} người` },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedRoom.status].class}`}>
                  {statusConfig[selectedRoom.status].label}
                </span>
                {selectedRoom.note && (
                  <span className="text-xs text-slate-400">{selectedRoom.note}</span>
                )}
              </div>

              {/* Khách đang thuê */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Khách đang thuê
                </p>
                {loadingTenants ? (
                  <p className="text-sm text-slate-400">Đang tải...</p>
                ) : roomTenants.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có khách nào</p>
                ) : (
                  <div className="space-y-2">
                    {roomTenants.map((t) => (
                      <div key={t._id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-indigo-600">
                            {t.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{t.fullName}</p>
                          <p className="text-xs text-slate-400">{t.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lịch sử người ở */}
              {roomHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Người ở cũ ({roomHistory.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {roomHistory.map((t) => (
                      <div key={t._id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 opacity-80">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-500">
                            {t.fullName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{t.fullName}</p>
                          <p className="text-xs text-slate-400">{t.phone}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 shrink-0">
                          đã rời
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleOpenEdit(selectedRoom)}
              >
                Sửa thông tin phòng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal sửa phòng */}
      <Dialog open={openEditModal} onOpenChange={(open) => {
        setOpenEditModal(open);
        if (!open) setError("");
      }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa phòng {selectedRoom?.roomNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số phòng</Label>
                <Input
                  placeholder="101"
                  value={editForm.roomNumber}
                  onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <Input
                  type="number" min={1}
                  value={editForm.floor}
                  onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Diện tích (m²)</Label>
                <Input
                  type="number" min={1}
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số người tối đa</Label>
                <Input
                  type="number" min={1} max={3}
                  value={editForm.maxPeople}
                  onChange={(e) => setEditForm({ ...editForm, maxPeople: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Giá thuê (đ/tháng)</Label>
              <Input
                type="number" min={1}
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input
                placeholder="Có điều hòa, ban công..."
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenEditModal(false)}>
                Hủy
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
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
    </div>
  );
}