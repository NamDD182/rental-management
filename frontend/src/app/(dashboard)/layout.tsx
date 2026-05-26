"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  FileText,
  Receipt,
  LogOut,
  Menu,
  Building2,
  User,
  Lock,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { href: "/",          icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/rooms",     icon: DoorOpen,        label: "Phòng trọ" },
  { href: "/tenants",   icon: Users,           label: "Khách thuê" },
  { href: "/contracts", icon: FileText,        label: "Hợp đồng" },
  { href: "/invoices",  icon: Receipt,         label: "Hóa đơn" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openProfile,  setOpenProfile]  = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");
  const [toast,        setToast]        = useState("");

  const [profileForm, setProfileForm] = useState({
    username: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setProfileForm({
        username: res.data.username || "",
        phone:    res.data.phone    || "",
      });
    } catch {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await api.put("/auth/me", profileForm);
      setOpenProfile(false);
      showToast("Cập nhật thông tin thành công!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("Mật khẩu mới phải ít nhất 6 ký tự");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });
      setOpenPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Đổi mật khẩu thành công!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800">Quản lí phòng trọ</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div> */}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-6 border-b border-slate-100"
          style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)" }}
        >
          <button className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-800">
              {/* {navItems.find((i) => i.href === pathname)?.label ?? "Dashboard"} */}
            </p>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-all"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-indigo-600">A</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-50">
                <button
                  onClick={() => { setDropdownOpen(false); setOpenProfile(true); setError(""); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); setOpenPassword(true); setError(""); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Lock className="h-4 w-4 text-slate-400" />
                  Đổi mật khẩu
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Modal thông tin cá nhân */}
      <Dialog open={openProfile} onOpenChange={(open) => { setOpenProfile(open); if (!open) setError(""); }}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Thông tin cá nhân</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên người dùng</Label>
              <Input
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenProfile(false)}>
                Hủy
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal đổi mật khẩu */}
      <Dialog open={openPassword} onOpenChange={(open) => { setOpenPassword(open); if (!open) { setError(""); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); } }}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Mật khẩu hiện tại</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Xác nhận mật khẩu mới</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenPassword(false)}>
                Hủy
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
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