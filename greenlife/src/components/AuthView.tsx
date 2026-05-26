import React, { useState } from "react";
import { User, Mail, ShieldAlert, Sparkles, Key, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAppContext } from "../context/AppContext";

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
  const { login, switchRole } = useAppContext();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<"customer" | "store">("customer");

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!loginEmail.trim()) {
      newErrors.loginEmail = "Email không được để trống.";
    } else if (!validateEmail(loginEmail)) {
      newErrors.loginEmail = "Email không đúng định dạng.";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Mật khẩu không được để trống.";
    } else if (loginPassword.length < 6) {
      newErrors.loginPassword = "Mật khẩu phải từ 6 ký tự.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Simulate authentication matching roles to emails
    let targetRole: "customer" | "store" | "admin" = "customer";
    if (loginEmail === "nursery.partner@greenlife.vn") {
      targetRole = "store";
    } else if (loginEmail === "ecology.root@greenlife.vn") {
      targetRole = "admin";
    }

    try {
      await login(loginEmail);
      await switchRole(targetRole);
    } catch (err) {
      setErrors({ global: "Lỗi kết nối cổng xác thực." });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!regName.trim()) {
      newErrors.regName = "Họ và tên không được để trống.";
    }

    if (!regEmail.trim()) {
      newErrors.regEmail = "Email không được để trống.";
    } else if (!validateEmail(regEmail)) {
      newErrors.regEmail = "Email không đúng định dạng.";
    }

    if (!regPassword) {
      newErrors.regPassword = "Mật khẩu không được để trống.";
    } else if (regPassword.length < 6) {
      newErrors.regPassword = "Mật khẩu phải từ 6 ký tự.";
    }

    if (regPassword !== regConfirmPassword) {
      newErrors.regConfirmPassword = "Xác nhận mật khẩu không khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSuccessMessage("Đăng ký thành công! Đang chuyển sang đăng nhập...");
    
    setTimeout(() => {
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setActiveTab("login");
      setSuccessMessage("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
    }, 1500);
  };

  const handleQuickDemoLogin = async (role: "customer" | "store" | "admin") => {
    let email = "vip.customer@greenlife.vn";
    if (role === "store") email = "nursery.partner@greenlife.vn";
    else if (role === "admin") email = "ecology.root@greenlife.vn";

    setErrors({});
    try {
      await login(email);
      await switchRole(role);
      // Demo redirects as requested:
      if (role === "admin") {
        setCurrentPage("admin-dashboard");
      } else if (role === "store") {
        setCurrentPage("store-dashboard");
      } else {
        setCurrentPage("home");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-20 pt-4 text-stone-100">
      
      {/* Left side: Premium Story & Info */}
      <div className="lg:col-span-6 space-y-6">
        <div className="inline-flex gap-2 items-center px-3 py-1 bg-emerald-950/80 border border-emerald-500/20 rounded-full text-emerald-400 font-mono text-xs">
          <Sparkles className="h-3 w-3" />
          <span>HỆ THỐNG XÁC THỰC SINH THÁI</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-stone-100 tracking-tight leading-none">
          Kết nối <br />
          <span className="text-emerald-400">GreenLife Portal</span>
        </h1>

        <p className="text-stone-400 text-sm leading-relaxed max-w-md">
          Đăng nhập tài khoản sinh thái để lưu vết lịch sử chẩn đoán cây bệnh AI tự động, tích lũy điểm thưởng carbon quy đổi sen đá hữu cơ và đặt hẹn nhanh cùng các chuyên gia nông học.
        </p>

        {/* Console role quick injector sandbox */}
        <div className="bg-stone-900/40 border border-stone-850 p-5 rounded-2xl space-y-3 max-w-md">
          <span className="text-[10px] text-stone-500 font-mono tracking-wider block">CHẾ ĐỘ DEMO HỆ THỐNG:</span>
          <p className="text-[11px] text-stone-400 leading-normal">
            Nhấp chuột để trải nghiệm nhanh từng vai trò hệ thống mà không cần nhập mật khẩu:
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("customer")}
              className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-900 border border-stone-850 text-stone-300 hover:text-emerald-400 hover:border-emerald-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left flex justify-between items-center"
            >
              <span>Đăng nhập khách hàng demo</span>
              <span className="text-[10px] text-stone-500 font-mono">Bypass → Trang Chủ</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("store")}
              className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-900 border border-stone-850 text-stone-300 hover:text-emerald-400 hover:border-emerald-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left flex justify-between items-center"
            >
              <span>Đăng nhập chủ cửa hàng demo</span>
              <span className="text-[10px] text-stone-500 font-mono">Bypass → Dashboard Cửa Hàng</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("admin")}
              className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-900 border border-stone-850 text-stone-300 hover:text-emerald-400 hover:border-emerald-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left flex justify-between items-center"
            >
              <span>Đăng nhập admin demo</span>
              <span className="text-[10px] text-stone-500 font-mono">Bypass → Dashboard Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side: Login / Register Form Card */}
      <div className="lg:col-span-6">
        <div className="bg-stone-950 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl" />

          {/* Custom Tabs */}
          <div className="flex border-b border-stone-850 pb-2 gap-4">
            <button
              onClick={() => {
                setActiveTab("login");
                setErrors({});
              }}
              className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "login" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setErrors({});
              }}
              className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "register" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký
            </button>
          </div>

          {errors.global && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{errors.global}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-500" />
                  Địa chỉ Email:
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ten.ban@greenlife.vn"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.loginEmail && (
                  <p className="text-[10px] text-rose-500">{errors.loginEmail}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Mật khẩu:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 pr-10 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.loginPassword && (
                  <p className="text-[10px] text-rose-500">{errors.loginPassword}</p>
                )}
              </div>

              <p className="text-[10px] text-stone-500 leading-normal">
                (*) Tài khoản được quản lý trong hệ sinh thái của GreenLife, cam kết không cung cấp thông tin cho bên thứ ba.
              </p>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                <LogIn className="h-4 w-4" />
                Khởi động phiên đăng nhập
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-stone-500" />
                  Họ và tên:
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.regName && (
                  <p className="text-[10px] text-rose-500">{errors.regName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-500" />
                  Địa chỉ Email:
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email.cua.ban@domain.com"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.regEmail && (
                  <p className="text-[10px] text-rose-500">{errors.regEmail}</p>
                )}
              </div>

              {/* Loại tài khoản */}
              <div className="space-y-2">
                <label className="text-xs text-stone-400 font-mono block">Loại tài khoản đăng ký:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRegRole("customer")}
                    className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      regRole === "customer"
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                        : "border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">Khách hàng</span>
                    <span className="text-[9px] leading-normal text-stone-400 mt-1 block">
                      Mua cây, đặt dịch vụ chăm sóc, chụp ảnh lá chẩn đoán bằng AI
                    </span>
                  </div>
                  <div
                    onClick={() => setRegRole("store")}
                    className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      regRole === "store"
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                        : "border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">Chủ cửa hàng</span>
                    <span className="text-[9px] leading-normal text-stone-400 mt-1 block">
                      Đăng sản phẩm lên sàn, quản lý đơn đặt hàng, nhận dịch vụ khảo sát
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 mt-2 leading-relaxed">
                  (*) Tài khoản Admin chỉ được cấp bởi Ban quản trị GreenLife. Tài khoản Chủ cửa hàng sẽ cần được hệ thống xác thực thông tin đăng ký kinh doanh và nguồn gốc vườn cây trước khi bắt đầu hoạt động chính thức.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Mật khẩu:
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.regPassword && (
                  <p className="text-[10px] text-rose-500">{errors.regPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Xác nhận mật khẩu:
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.regConfirmPassword && (
                  <p className="text-[10px] text-rose-500">{errors.regConfirmPassword}</p>
                )}
              </div>

              <p className="text-[10px] text-stone-500 leading-normal">
                Bằng cách nhấp vào nút Đăng ký, bạn đồng ý với Quy chế sử dụng nguồn lực xanh của Hợp tác xã GreenLife.
              </p>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Tạo tài khoản sinh thái
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
