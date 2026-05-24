"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  FileText,
  Receipt,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/rooms", icon: DoorOpen, label: "Phòng trọ" },
  { href: "/tenants", icon: Users, label: "Khách thuê" },
  { href: "/contracts", icon: FileText, label: "Hợp đồng" },
  { href: "/invoices", icon: Receipt, label: "Hóa đơn" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800">Rental Management</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 items-center justify-between px-6 border-b border-slate-100"
          style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-800">
              {navItems.find((i) => i.href === pathname)?.label ?? "Dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-600">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}