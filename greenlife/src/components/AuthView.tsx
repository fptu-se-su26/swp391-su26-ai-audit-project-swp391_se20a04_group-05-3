import React, { useState } from "react";
import { User, Mail, ShieldAlert, Sparkles, UserCheck, Key, LogIn, ArrowRight } from "lucide-react";

interface AuthViewProps {
  userRole: "customer" | "store" | "admin";
  setUserRole: (role: "customer" | "store" | "admin") => void;
  setCurrentPage: (page: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  userRole,
  setUserRole,
  setCurrentPage,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("vip.customer@greenlife.vn");
  const [password, setPassword] = useState("••••••••");

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Transition to appropriate dashboard page based on current chosen simulator role
    if (userRole === "customer") {
      setCurrentPage("customer-dashboard");
    } else if (userRole === "store") {
      setCurrentPage("store-dashboard");
    } else if (userRole === "admin") {
      setCurrentPage("admin-dashboard");
    }
  };

  const handleQuickInjector = (role: "customer" | "store" | "admin") => {
    setUserRole(role);
    if (role === "customer") {
      setEmail("vip.customer@greenlife.vn");
    } else if (role === "store") {
      setEmail("nursery.partner@greenlife.vn");
    } else if (role === "admin") {
      setEmail("ecology.root@greenlife.vn");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-20 pt-4">
      
      {/* Left side: Premium Brand Story */}
      <div className="lg:col-span-6 space-y-6">
        <div className="inline-flex gap-2 items-center px-3 py-1 bg-emerald-950/80 border border-emerald-500/20 rounded-full text-emerald-400 font-mono text-xs">
          <Sparkles className="h-3 w-3" />
          <span>HÖ THỐNG XÁC THỰC SINH THÁI</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight leading-none">
          Kết nối <br />
          <span className="text-emerald-400">GreenLife Portal</span>
        </h1>

        <p className="text-stone-400 text-sm leading-relaxed max-w-md">
          Đăng ký tài khoản sinh thái để lưu vết lịch sử chẩn đoán cây bệnh AI tự động, tích lũy điểm thưởng carbon quy đổi sen đá hữu cơ và đặt hẹn nhanh cùng agronomists.
        </p>

        {/* Console role quick injector sandbox */}
        <div className="bg-stone-900/40 border border-stone-850 p-5 rounded-2xl space-y-3 max-w-md">
          <span className="text-[10px] text-stone-500 font-mono tracking-wider block">BẢNG PHÁT TRIỂN / THỬ NGHIỆM ĐỒNG BỘ:</span>
          <p className="text-[11px] text-stone-400 leading-normal">
            Nhấp và chọn nhanh vị thế tài khoản để hệ thống tự động tải quyền truy cập hệ trị sinh học tương ứng:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: "customer", label: "Khách VIP" },
              { id: "store", label: "Đối tác Kho" },
              { id: "admin", label: "Tổng Admin" }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickInjector(r.id as any)}
                className={`py-2 px-1 rounded-xl text-[10px] font-mono border font-semibold transition-all ${
                  userRole === r.id
                    ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                    : "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Login / Register Form Card */}
      <div className="lg:col-span-6">
        <div className="bg-[#141414] border border-[#242424] p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl" />

          {/* Tab Toggler header */}
          <div className="flex border-b border-stone-850 pb-2 gap-4">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-2.5 text-sm font-semibold transition-all ${
                isLogin ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Đăng Nhập Cổng
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-2.5 text-sm font-semibold transition-all ${
                !isLogin ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Tạo Trải Nghiệm Mới
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-stone-500" />
                Địa chỉ Email sinh quy:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten.ban@greenlife.vn"
                className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-stone-500" />
                Mật mã sinh trắc:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu của bạn"
                className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                required
              />
            </div>

            {/* Simulated verification notes */}
            <p className="text-[10px] text-stone-500 leading-normal">
              Bằng cách tiếp tục, bạn đồng ý với các Điều khoản Sử dụng Nguồn mở sinh thái GreenLife và cam kết canh tác 100% không dùng rác thải nhựa một lần.
            </p>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              <LogIn className="h-4 w-4" />
              {isLogin ? "Khởi động phiên đăng nhập" : "Kích hoạt tài khoản sinh thái"}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};
