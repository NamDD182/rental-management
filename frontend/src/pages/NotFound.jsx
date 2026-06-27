import { useNavigate } from "react-router-dom";
import { Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-[-100px] left-[-100px] h-80 w-80 rounded-full blur-[140px]"
        style={{
          background: "rgba(99,102,241,0.3)",
        }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] h-80 w-80 rounded-full blur-[120px]"
        style={{
          background: "rgba(139,92,246,0.2)",
        }}
      />

      <div className="relative z-10 text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-indigo-400" />
          </div>
        </div>

        {/* 404 */}
        <div
          className="text-[120px] font-bold leading-none"
          style={{
            background: "linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">Trang không tồn tại</h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>

        <Button
          onClick={() => navigate("/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 gap-2"
        >
          <Home className="h-4 w-4" />
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
