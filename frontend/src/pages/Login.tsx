
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Eye, EyeOff, Loader2, Users, Receipt, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
    >
      {/* Glow */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-[140px]"
        style={{ background: "rgba(99,102,241,0.3)" }} />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full blur-[120px]"
        style={{ background: "rgba(139,92,246,0.2)" }} />
      <div className="absolute -bottom-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[150px]"
        style={{ background: "rgba(99,102,241,0.25)" }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2">

          {/* LEFT */}
          <div className="hidden lg:flex flex-col justify-center text-white">
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-xl"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Building2 className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Rental Management</h2>
                <p className="text-sm text-white/50">Hệ thống quản lý phòng trọ</p>
              </div>
            </div>

            <h1 className="text-5xl font-semibold leading-tight tracking-tight">
              Quản lý khu trọ
              <br />
              <span className="text-indigo-400">theo cách hiện đại.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg text-white/50">
              Quản lý khách thuê, hợp đồng, điện nước và hóa đơn trên một nền tảng duy nhất.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Khách thuê", sub: "Quản lý cư dân" },
                { icon: Receipt, label: "Hóa đơn", sub: "Tự động tính phí" },
                { icon: ShieldCheck, label: "Bảo mật", sub: "Đăng nhập an toàn" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-3xl p-5 backdrop-blur-xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Icon className="w-6 h-6 text-indigo-400 mb-3" />
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-xs text-white/40 mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — login card */}
          <div className="flex items-center justify-center">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-[36px] p-8 backdrop-blur-3xl"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {/* Glass highlight */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[36px]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }}
              />

              <div className="relative">
                <div className="mb-8 text-center">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl backdrop-blur-xl"
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}
                  >
                    <Building2 className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-semibold text-white">Đăng nhập</h2>
                  <p className="mt-2 text-sm text-white/50">Chào mừng bạn quay trở lại</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label className="mb-2 block text-white/70 text-sm">Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-12 rounded-2xl text-white placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-white/70 text-sm">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 rounded-2xl pr-12 text-white placeholder:text-white/30"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      className="rounded-2xl p-3 text-sm text-red-200"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-2xl font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang đăng nhập...
                      </span>
                    ) : "Đăng nhập"}
                  </Button>
                </form>

                <p className="mt-8 text-center text-xs text-white/30">© 2026 Rental Management</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}