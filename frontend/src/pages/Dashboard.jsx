import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { DoorOpen, Users, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [toast, setToast] = useState("");
  const [overdueContracts, setOverdueContracts] = useState([]);
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
      const rooms = roomsRes.data;
      const tenants = tenantsRes.data;
      const invoices = invoicesRes.data;
      const contracts = contractsRes.data;
      const now = new Date();
      setStats({
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter((r) => r.status === "occupied").length,
        emptyRooms: rooms.filter((r) => r.status === "empty").length,
        totalTenants: tenants.length,
        unpaidAmount: invoices
          .filter((i) => i.status === "unpaid" || i.status === "overdue")
          .reduce((sum, i) => sum + i.totalAmount, 0),
        unpaidCount: invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length,
      });
      setUnpaid(invoices.filter((i) => i.status === "unpaid" || i.status === "overdue"));

      // Hợp đồng sắp hết hạn trong 30 ngày
      const soonExpired = contracts.filter((c) => {
        if (!c.endDate || c.status !== "active") return false;
        const diff = (new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      });

      // Hợp đồng đã quá hạn
      const overExpired = contracts.filter((c) => {
        if (!c.endDate || c.status !== "active") return false;
        const diff = (new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff < 0;
      });
      setContracts(soonExpired);
      setOverdueContracts(overExpired);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Tính doanh thu 6 tháng gần nhất
      const monthNames = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];
      const last6Months = Array.from(
        {
          length: 6,
        },
        (_, i) => {
          let month = currentMonth - (5 - i);
          let year = currentYear;
          if (month <= 0) {
            month += 12;
            year -= 1;
          }
          return {
            month,
            year,
          };
        },
      );
      const chart = last6Months.map(({ month, year }) => {
        const monthInvoices = invoices.filter((i) => i.month === month && i.year === year);
        const doanhThu = monthInvoices
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + i.totalAmount, 0);
        const chuaThu = monthInvoices
          .filter((i) => i.status === "unpaid" || i.status === "overdue")
          .reduce((sum, i) => sum + i.totalAmount, 0);
        return {
          name: `${monthNames[month - 1]}/${year}`,
          doanhThu,
          chuaThu,
        };
      });
      setChartData(chart);
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
  const handlePay = async (invoice) => {
    try {
      setPaying(invoice._id);
      await api.put(`/invoices/${invoice._id}/pay`, {
        paymentMethod: "cash",
      });
      showToast("Đã đánh dấu thanh toán!");
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setPaying(null);
    }
  };
  const getDaysLeft = (endDate) => {
    return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  // Format tiền rút gọn cho chart
  const formatMoney = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}tr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
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
            sub: `${stats?.totalTenants} khách • ${stats?.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}% lấp đầy`,
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

      {/* Biểu đồ doanh thu */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-800">Doanh thu 6 tháng gần nhất</h2>
            <p className="text-xs text-slate-400 mt-0.5">Đã thu và chưa thu</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Đã thu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Chưa thu
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 12,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatMoney}
              tick={{
                fontSize: 12,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value.toLocaleString("vi-VN")}đ`]}
              labelStyle={{
                color: "#475569",
                fontWeight: 600,
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Bar dataKey="doanhThu" name="Đã thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="chuaThu" name="Chưa thu" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
                      {invoice.contractId?.tenantId?.fullName} • Tháng {invoice.month}/
                      {invoice.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-indigo-600">
                      {invoice.totalAmount.toLocaleString("vi-VN")}đ
                    </p>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                      onClick={() => navigate("/invoices")}
                    >
                      Thu tiền
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
            <h2 className="font-semibold text-slate-800">Hợp đồng cần chú ý</h2>
            <div className="flex gap-2">
              {overdueContracts.length > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                  {overdueContracts.length} quá hạn
                </span>
              )}
              {contracts.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full font-medium">
                  {contracts.length} sắp hết
                </span>
              )}
            </div>
          </div>

          {contracts.length === 0 && overdueContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <DoorOpen className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Không có hợp đồng cần chú ý</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Quá hạn trước */}
              {overdueContracts.map((contract) => {
                const days = Math.abs(getDaysLeft(contract.endDate));
                return (
                  <div key={contract._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Phòng {contract.roomId?.roomNumber}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{contract.tenantId?.fullName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-600">
                        Quá {days} ngày
                      </span>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        onClick={() => navigate("/contracts")}
                      >
                        Xử lý
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Sắp hết hạn */}
              {contracts.map((contract) => {
                const days = getDaysLeft(contract.endDate);
                return (
                  <div key={contract._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Phòng {contract.roomId?.roomNumber}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{contract.tenantId?.fullName}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${days <= 7 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                    >
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
