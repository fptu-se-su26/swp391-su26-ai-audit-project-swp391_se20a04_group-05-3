import React, { useState } from "react";
import { User, Mail, ShieldAlert, Sparkles, Key, LogIn, UserPlus, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { AuthService } from "../../services/authService";

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
  const { login, register, registerVerify, forgotPasswordRequest, resetPasswordVerify } = useAppContext();
  const [viewState, setViewState] = useState<"login" | "register" | "verify-register-otp" | "forgot-password" | "verify-reset-otp">("login");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<"customer" | "store" | "admin">("customer");

  // OTP & Reset States
  const [otp, setOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Error & UI States
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
    
    try {
      await login(loginEmail, loginPassword);
      const actualUser = await AuthService.getCurrentUser();
      
      if (actualUser.role === "admin") {
        setCurrentPage("admin-dashboard");
      } else if (actualUser.role === "store") {
        setCurrentPage("store-dashboard");
      } else {
        setCurrentPage("home");
      }
    } catch (err: any) {
      setErrors({ global: err.message || "Tên đăng nhập hoặc mật khẩu không chính xác." });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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

    try {
      setErrors({});
      setOtp("");
      const result = await register(regName, regEmail, regRole, regPassword);
      setSuccessMessage(result.message || "Mã OTP xác thực đã được gửi tới email của bạn.");
      setViewState("verify-register-otp");
    } catch (err: any) {
      setErrors({ global: err.message || "Email đã tồn tại hoặc lỗi đăng ký." });
    }
  };

  const handleRegisterVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors({ otp: "Mã OTP không được để trống." });
      return;
    }
    try {
      setErrors({});
      await registerVerify(regEmail, otp);
      setSuccessMessage("Xác thực đăng ký thành công!");
      setTimeout(() => {
        setSuccessMessage("");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
        setOtp("");
        setCurrentPage("home");
      }, 1500);
    } catch (err: any) {
      setErrors({ otp: err.message || "Mã OTP không chính xác." });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrors({ forgotEmail: "Email không được để trống." });
      return;
    } else if (!validateEmail(forgotEmail)) {
      setErrors({ forgotEmail: "Email không đúng định dạng." });
      return;
    }
    try {
      setErrors({});
      setOtp("");
      const result = await forgotPasswordRequest(forgotEmail);
      setSuccessMessage(result.message || "Mã OTP đặt lại mật khẩu đã được gửi.");
      setViewState("verify-reset-otp");
    } catch (err: any) {
      setErrors({ forgotEmail: err.message || "Địa chỉ email không tồn tại trên hệ thống." });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!otp.trim()) {
      newErrors.otp = "Mã OTP không được để trống.";
    }
    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới không được để trống.";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải từ 6 ký tự.";
    }
    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Xác nhận mật khẩu mới không khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setErrors({});
      await resetPasswordVerify(forgotEmail, otp, newPassword);
      setSuccessMessage("Đặt lại mật khẩu thành công! Đang chuyển sang đăng nhập...");
      setTimeout(() => {
        setSuccessMessage("");
        setLoginEmail(forgotEmail);
        setLoginPassword(newPassword);
        setForgotEmail("");
        setNewPassword("");
        setConfirmNewPassword("");
        setOtp("");
        setViewState("login");
      }, 1500);
    } catch (err: any) {
      setErrors({ global: err.message || "Mã OTP không chính xác hoặc đã hết hạn." });
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
      </div>

      {/* Right side: Login / Register Form Card */}
      <div className="lg:col-span-6">
        <div className="bg-stone-950 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl" />

          {/* Custom Tabs */}
          {(viewState === "login" || viewState === "register") && (
            <div className="flex border-b border-stone-850 pb-2 gap-4">
              <button
                onClick={() => {
                  setViewState("login");
                  setErrors({});
                }}
                className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewState === "login" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setViewState("register");
                  setErrors({});
                }}
                className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewState === "register" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Đăng ký
              </button>
            </div>
          )}

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

          {/* VIEW 1: LOGIN FORM */}
          {viewState === "login" && (
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
                <div className="flex justify-between items-center">
                  <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-stone-500" />
                    Mật khẩu:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewState("forgot-password");
                      setErrors({});
                      setSuccessMessage("");
                    }}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
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

              <div className="border-t border-stone-850 pt-5 mt-2 space-y-3">
                <span className="text-[10px] text-stone-500 font-mono uppercase block tracking-widest text-center font-bold">
                  ĐĂNG NHẬP GIẢ LẬP DEMO NHANH 🚀
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoginEmail("admin@greenlife.vn");
                      setLoginPassword("hash_admin");
                      await login("admin@greenlife.vn", "hash_admin");
                      setCurrentPage("admin-dashboard");
                    }}
                    className="p-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-500/50 rounded-xl text-[10px] font-bold text-rose-400 cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Quản Trị</span>
                    <span className="text-[8px] font-mono font-normal">Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoginEmail("store1@greenlife.vn");
                      setLoginPassword("hash_store");
                      await login("store1@greenlife.vn", "hash_store");
                      setCurrentPage("store-dashboard");
                    }}
                    className="p-2.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 hover:border-amber-500/50 rounded-xl text-[10px] font-bold text-amber-400 cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Nhà Vườn</span>
                    <span className="text-[8px] font-mono font-normal">Store</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoginEmail("lan@gmail.com");
                      setLoginPassword("hash_lan");
                      await login("lan@gmail.com", "hash_lan");
                      setCurrentPage("home");
                    }}
                    className="p-2.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-emerald-400 cursor-pointer text-center flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Khách Hàng</span>
                    <span className="text-[8px] font-mono font-normal">Customer</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW 2: REGISTER FORM */}
          {viewState === "register" && (
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setRegRole("customer")}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      regRole === "customer"
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                        : "border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">Khách hàng</span>
                    <span className="text-[9px] leading-normal text-stone-400 mt-1 block">
                      Mua cây, chat Bác sĩ AI
                    </span>
                  </div>
                  <div
                    onClick={() => setRegRole("store")}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      regRole === "store"
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                        : "border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">Cửa hàng</span>
                    <span className="text-[9px] leading-normal text-stone-400 mt-1 block">
                      Đăng bán, nhận đơn
                    </span>
                  </div>
                  <div
                    onClick={() => setRegRole("admin")}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      regRole === "admin"
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                        : "border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">Quản trị</span>
                    <span className="text-[9px] leading-normal text-stone-400 mt-1 block">
                      Quản lý hệ sinh thái xanh
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 mt-2 leading-relaxed">
                  (*) Tài khoản Chủ cửa hàng sẽ cần được hệ thống xác thực thông tin đăng ký kinh doanh và nguồn gốc vườn cây trước khi bắt đầu hoạt động chính thức.
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
                Đăng ký & nhận mã OTP qua Mail
              </button>
            </form>
          )}

          {/* VIEW 3: REGISTER OTP VERIFICATION */}
          {viewState === "verify-register-otp" && (
            <form onSubmit={handleRegisterVerifySubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200">Xác thực OTP Đăng ký</h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Vui lòng nhập mã OTP 6 chữ số đã được gửi tới email <strong>{regEmail}</strong>.
                </p>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Nhập mã OTP 6 số"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-850 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-center font-mono tracking-widest text-lg focus:outline-none"
                />
                {errors.otp && (
                  <p className="text-[10px] text-rose-500">{errors.otp}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Xác nhận kích hoạt tài khoản
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewState("register");
                  setErrors({});
                  setSuccessMessage("");
                }}
                className="w-full text-center text-xs text-stone-400 hover:underline mt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng ký
              </button>
            </form>
          )}

          {/* VIEW 4: FORGOT PASSWORD */}
          {viewState === "forgot-password" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200">Quên mật khẩu</h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Nhập địa chỉ email đăng ký tài khoản của bạn để nhận mã OTP khôi phục mật khẩu.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-500" />
                  Địa chỉ Email:
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="email.cua.ban@domain.com"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.forgotEmail && (
                  <p className="text-[10px] text-rose-500">{errors.forgotEmail}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Nhận mã OTP đặt lại mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewState("login");
                  setErrors({});
                  setSuccessMessage("");
                }}
                className="w-full text-center text-xs text-stone-400 hover:underline mt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* VIEW 5: VERIFY OTP & RESET PASSWORD */}
          {viewState === "verify-reset-otp" && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200">Đặt lại mật khẩu mới</h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Mã OTP đặt lại mật khẩu đã được gửi tới email <strong>{forgotEmail}</strong>. Vui lòng nhập mã OTP và mật khẩu mới của bạn.
                </p>
              </div>
              {/* OTP */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono">Mã OTP xác thực:</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Nhập mã OTP 6 số"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-850 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-center font-mono tracking-widest text-lg focus:outline-none"
                />
                {errors.otp && (
                  <p className="text-[10px] text-rose-500">{errors.otp}</p>
                )}
              </div>
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Mật khẩu mới:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.newPassword && (
                  <p className="text-[10px] text-rose-500">{errors.newPassword}</p>
                )}
              </div>
              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Xác nhận mật khẩu mới:
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                />
                {errors.confirmNewPassword && (
                  <p className="text-[10px] text-rose-500">{errors.confirmNewPassword}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Cập nhật mật khẩu & Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewState("forgot-password");
                  setErrors({});
                  setSuccessMessage("");
                }}
                className="w-full text-center text-xs text-stone-400 hover:underline mt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
