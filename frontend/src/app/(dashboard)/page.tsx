"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { DoorOpen, Users, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stats {
  totalRooms: number;
  occupiedRooms: number;
  emptyRooms: number;
  totalTenants: number;
  unpaidAmount: number;
  unpaidCount: number;
}

interface Invoice {
  _id: string;
  contractId: {
    roomId: { roomNumber: string };
    tenantId: { fullName: string };
  };
  month: number;
  year: number;
  totalAmount: number;
  status: string;
}

interface Contract {
  _id: string;
  roomId: { roomNumber: string };
  tenantId: { fullName: string };
  endDate: string | null;
  status: string;
}

export default function DashboardPage() {
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [unpaid,    setUnpaid]    = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState<string | null>(null);
  const [toast,     setToast]     = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, tenantsRes, invoicesRes, contractsRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/tenants"),
        api.get("/invoices"),
        api.get("/contracts"),
      ]);

       console.log("contracts:", contractsRes.data);

      const rooms     = roomsRes.data;
      const tenants   = tenantsRes.data;
      const invoices  = invoicesRes.data;
      const contracts = contractsRes.data;

      // Tính stats
      setStats({
        totalRooms:    rooms.length,
        occupiedRooms: rooms.filter((r: any) => r.status === "occupied").length,
        emptyRooms:    rooms.filter((r: any) => r.status === "empty").length,
        totalTenants:  tenants.length,
        unpaidAmount:  invoices
          .filter((i: any) => i.status === "unpaid")
          .reduce((sum: number, i: any) => sum + i.totalAmount, 0),
        unpaidCount: invoices.filter((i: any) => i.status === "unpaid").length,
      });

      // Hóa đơn chưa thu
      setUnpaid(invoices.filter((i: any) => i.status === "unpaid"));

      // Hợp đồng sắp hết hạn (trong 30 ngày)
      const now = new Date();
      const soon = contracts.filter((c: any) => {
        if (!c.endDate || c.status !== "active") return false;
        const end  = new Date(c.endDate);
        const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      });
      setContracts(soon);
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

  const handlePay = async (invoice: Invoice) => {
    try {
      setPaying(invoice._id);
      await api.put(`/invoices/${invoice._id}/pay`);
      showToast("Đã đánh dấu thanh toán!");
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setPaying(null);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const diff = (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Tổng quan</h1>
        <p className="text-slate-400 text-sm mt-0.5">Chào mừng trở lại!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng phòng",
            value: stats?.totalRooms,
            sub: `${stats?.emptyRooms} còn trống`,
            icon: DoorOpen,
            color: "bg-indigo-100 text-indigo-600",
          },
          {
            label: "Đang cho thuê",
            value: stats?.occupiedRooms,
            sub: `${stats?.totalTenants} khách thuê`,
            icon: Users,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "Chưa thu",
            value: stats?.unpaidCount,
            sub: "hóa đơn",
            icon: Receipt,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Tổng chưa thu",
            value: stats?.unpaidAmount.toLocaleString("vi-VN") + "đ",
            sub: "cần thu",
            icon: TrendingUp,
            color: "bg-rose-100 text-rose-600",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{card.label}</p>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hóa đơn chưa thu */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Hóa đơn chưa thu</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              {unpaid.length} hóa đơn
            </span>
          </div>

          {unpaid.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Receipt className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Tất cả đã thanh toán!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {unpaid.map((invoice) => (
                <div key={invoice._id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Phòng {invoice.contractId?.roomId?.roomNumber}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {invoice.contractId?.tenantId?.fullName} • Tháng {invoice.month}/{invoice.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-indigo-600">
                      {invoice.totalAmount.toLocaleString("vi-VN")}đ
                    </p>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      onClick={() => handlePay(invoice)}
                      disabled={paying === invoice._id}
                    >
                      {paying === invoice._id ? "..." : "Thu"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hợp đồng sắp hết hạn */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Hợp đồng sắp hết hạn</h2>
            <span className="text-xs bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full font-medium">
              Trong 30 ngày
            </span>
          </div>

          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <DoorOpen className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Không có hợp đồng sắp hết hạn</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {contracts.map((contract) => {
                const days = getDaysLeft(contract.endDate!);
                return (
                  <div key={contract._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Phòng {contract.roomId?.roomNumber}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {contract.tenantId?.fullName}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      days <= 7
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}>
                      còn {days} ngày
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}