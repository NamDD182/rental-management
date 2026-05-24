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
import { Plus, DoorOpen, Loader2 } from "lucide-react";

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  area: number;
  price: number;
  maxPeople: number;
  status: "empty" | "occupied" | "maintenance";
  note: string;
}

const statusConfig = {
  empty: { label: "Còn trống", class: "bg-emerald-100 text-emerald-700" },
  occupied: { label: "Đang thuê", class: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Bảo trì", class: "bg-amber-100 text-amber-700" },
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
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate frontend trước
    if (Number(form.floor) < 1) {
      setError("Tầng phải lớn hơn 0");
      return;
    }
    if (Number(form.maxPeople) < 1) {
      setError("Số người tối đa phải ít nhất 1");
      return;
    }
    if (Number(form.area) <= 0) {
      setError("Diện tích phải lớn hơn 0");
      return;
    }
    if (Number(form.price) <= 0) {
      setError("Giá thuê phải lớn hơn 0");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await api.post("/rooms", {
        roomNumber: form.roomNumber,
        floor: Number(form.floor),
        area: Number(form.area),
        price: Number(form.price),
        maxPeople: Number(form.maxPeople),
        note: form.note,
      });
      setOpenModal(false);
      setForm(defaultForm);
      fetchRooms();
    } catch (err: any) {
      // Lấy message từ Mongoose validation error
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      if (msg.includes("maxPeople")) {
        setError("Số người tối đa phải ít nhất 1");
      } else if (msg.includes("roomNumber")) {
        setError("Số phòng đã tồn tại");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Grid */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <DoorOpen className="h-12 w-12 mb-3 opacity-30" />
          <p>Chưa có phòng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-800">
                    Phòng {room.roomNumber}
                  </p>
                  <p className="text-xs text-slate-400">Tầng {room.floor}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[room.status].class}`}
                >
                  {statusConfig[room.status].label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Diện tích</span>
                  <span className="text-slate-700 font-medium">
                    {room.area} m²
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số người</span>
                  <span className="text-slate-700 font-medium">
                    {room.maxPeople} người
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
      )}

      {/* Modal thêm phòng */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
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
                  onChange={(e) =>
                    setForm({ ...form, roomNumber: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tầng</Label>
                <Input
                  type="number"
                  placeholder="1"
                  min={1}
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
                  type="number"
                  placeholder="25"
                  min={1}
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số người tối đa</Label>
                <Input
                  type="number"
                  placeholder="2"
                  min={1}
                  max={10}
                  value={form.maxPeople}
                  onChange={(e) =>
                    setForm({ ...form, maxPeople: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Giá thuê (đ/tháng)</Label>
              <Input
                type="number"
                placeholder="2500000"
                min={1}
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
                  "Thêm phòng"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
