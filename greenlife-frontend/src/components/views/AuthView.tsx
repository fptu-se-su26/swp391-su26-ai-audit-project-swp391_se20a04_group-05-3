import React, { useState, useRef } from "react";
import { User, Mail, ShieldAlert, Sparkles, Key, LogIn, UserPlus, Eye, EyeOff, Shield, Leaf, CheckCircle2, Award, ArrowLeft } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { AuthService } from "../../services/authService";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

const isGoogleClientIdValid = (clientId: string | undefined): boolean => {
  if (!clientId) return false;
  const clean = clientId.trim();
  if (clean === "" || clean.startsWith("YOUR_") || clean.startsWith("your_") || clean.startsWith("your-") || clean.includes("placeholder")) {
    return false;
  }
  return true;
};


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
  const { login, register, registerRequest, verifyRegistrationOTP, loginWithGoogle, theme } = useAppContext();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">("login");

  // Phase 4-J6: Guard to ensure Google Identity SDK is initialized exactly once per mount.
  // Previously the useEffect depended on [activeTab], causing google.accounts.id.initialize()
  // to be called on every tab change — triggering the [GSI_LOGGER] warning and creating
  // multiple concurrent initialization states.
  const googleInitializedRef = useRef(false);

  // Phase 4-J6: Guard to prevent duplicate login submissions (double-click or rapid Enter).
  const isLoginInFlight = useRef(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<"customer" | "store" | "admin">("customer");

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(180);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState<string[]>(Array(6).fill(""));
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotCountdown, setForgotCountdown] = useState(180);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);
  const [isForgotResendDisabled, setIsForgotResendDisabled] = useState(true);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Phase 4-J6: Google Identity SDK initialization — runs exactly once per component mount.
  // Using a ref guard (googleInitializedRef) ensures initialize() is not called again if the
  // user switches between login/register tabs.
  React.useEffect(() => {
    if (googleInitializedRef.current) return; // Already initialized — skip.

    const isClientIdValid = (clientId: string | undefined): boolean => {
      if (!clientId) return false;
      const clean = clientId.trim();
      if (clean === "" || clean.startsWith("YOUR_") || clean.startsWith("your_") || clean.startsWith("your-") || clean.includes("placeholder")) {
        return false;
      }
      return true;
    };

    if (!isClientIdValid(GOOGLE_CLIENT_ID)) {
      return;
    }

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: async (response: any) => {
            try {
              await loginWithGoogle(response.credential);
              setCurrentPage("home");
            } catch (err: any) {
              setErrors({ global: err.message || "Đăng nhập bằng Google thất bại." });
            }
          }
        });
        googleInitializedRef.current = true; // Mark as initialized
      }
    };

    const timer = setInterval(() => {
      const google = (window as any).google;
      if (google && google.accounts) {
        initializeGoogleSignIn();
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []); // Empty deps — initialize only once per mount, not on tab change



  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpScreen && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOtpScreen, countdown]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpScreen && resendCooldown > 0) {
      setIsResendDisabled(true);
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    } else if (resendCooldown === 0) {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [showOtpScreen, resendCooldown]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === "forgot-password" && forgotStep === 2 && forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [activeTab, forgotStep, forgotCountdown]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === "forgot-password" && forgotStep === 2 && forgotResendCooldown > 0) {
      setIsForgotResendDisabled(true);
      timer = setTimeout(() => setForgotResendCooldown(prev => prev - 1), 1000);
    } else if (forgotResendCooldown === 0) {
      setIsForgotResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [activeTab, forgotStep, forgotResendCooldown]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otpCode];
    newOtp[index] = element.value;
    setOtpCode(newOtp);

    // Focus next input
    if (element.value !== "" && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otpCode[index] === "" && e.currentTarget.previousSibling) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      setErrors({});
      await registerRequest(regName, regEmail, regRole, regPassword);
      setCountdown(180);
      setResendCooldown(60);
      setSuccessMessage("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrors({ global: err.message || "Gửi lại OTP thất bại." });
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
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
      await AuthService.forgotPassword(forgotEmail);
      setForgotStep(2);
      setForgotCountdown(180);
      setForgotResendCooldown(60);
      setSuccessMessage("Đã gửi mã OTP đặt lại mật khẩu về email của bạn!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrors({ global: err.message || "Không thể yêu cầu đặt lại mật khẩu." });
    }
  };

  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = forgotOtpCode.join("");
    if (code.length < 6) {
      setErrors({ global: "Vui lòng nhập đủ 6 chữ số mã OTP." });
      return;
    }
    try {
      setErrors({});
      const res = await AuthService.verifyResetOtp(forgotEmail, code);
      setForgotToken(res.resetToken);
      setForgotStep(3);
      setSuccessMessage("Mã OTP hợp lệ! Vui lòng thiết lập mật khẩu mới.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrors({ global: err.message || "Xác minh OTP thất bại." });
    }
  };

  const handleForgotResendOtp = async () => {
    try {
      setErrors({});
      await AuthService.forgotPassword(forgotEmail);
      setForgotCountdown(180);
      setForgotResendCooldown(60);
      setSuccessMessage("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrors({ global: err.message || "Gửi lại OTP thất bại." });
    }
  };

  const handleForgotResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
    if (!forgotNewPassword) {
      setErrors({ forgotNewPassword: "Mật khẩu không được để trống." });
      return;
    } else if (!passwordRegex.test(forgotNewPassword)) {
      setErrors({ forgotNewPassword: "Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số." });
      return;
    }
    try {
      setErrors({});
      await AuthService.resetPassword(forgotToken, forgotNewPassword);
      setSuccessMessage("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
      setTimeout(() => {
        setLoginEmail(forgotEmail);
        setLoginPassword("");
        setActiveTab("login");
        setSuccessMessage("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        setTimeout(() => setSuccessMessage(""), 5000);
      }, 1500);
    } catch (err: any) {
      setErrors({ global: err.message || "Đặt lại mật khẩu thất bại." });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 6) {
      setErrors({ global: "Vui lòng nhập đủ 6 chữ số mã OTP." });
      return;
    }

    try {
      setErrors({});
      await verifyRegistrationOTP(regEmail, code);
      setSuccessMessage("Xác thực OTP thành công! Vui lòng đăng nhập với tài khoản của bạn.");
      
      setTimeout(() => {
        setLoginEmail(regEmail);
        setLoginPassword("");
        setActiveTab("login");
        setShowOtpScreen(false);
        setSuccessMessage("Xác thực OTP thành công! Vui lòng đăng nhập với tài khoản của bạn.");
        setTimeout(() => setSuccessMessage(""), 5000);
      }, 1500);
    } catch (err: any) {
      setErrors({ global: err.message || "Xác thực OTP thất bại. Vui lòng thử lại." });
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Phase 4-J6: Guard against duplicate login submissions.
  // login() in AppContext already calls AuthService.login() and sets currentUser.
  // The extra AuthService.getCurrentUser() call that was here previously fired a redundant
  // GET /api/auth/me after every successful login — removed to reduce DB pressure.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submission
    if (isLoginInFlight.current) return;

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
    isLoginInFlight.current = true;
    setIsLoginLoading(true);

    try {
      // login() sets currentUser and userRole in AppContext; no extra /api/auth/me needed.
      const user = await login(loginEmail, loginPassword);

      // Use the user object from AppContext (already set by login())
      // Route based on role — AppContext.login() throws on failure, so if we reach here it succeeded.
      // We can rely on the role that AppContext.login() already set.
      // Navigate using a brief setTimeout so React state settles.
      setTimeout(() => {
        // Read the role that AppContext just set via login()
        const savedRole = localStorage.getItem("greenlife_active_role");
        if (savedRole === "admin") {
          setCurrentPage("admin-dashboard");
        } else if (savedRole === "store") {
          setCurrentPage("store-dashboard");
        } else {
          setCurrentPage("customer-dashboard");
        }
      }, 50);
    } catch (err: any) {
      let errMsg = err.message || "Lỗi kết nối cổng xác thực hoặc thông tin mật khẩu không chính xác.";
      if (!errMsg.toLowerCase().includes("sai")) {
        errMsg += " (Thông tin sai)";
      }
      setErrors({ global: errMsg });
      toast.error(errMsg);
    } finally {
      isLoginInFlight.current = false;
      setIsLoginLoading(false);
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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
    if (!regPassword) {
      newErrors.regPassword = "Mật khẩu không được để trống.";
    } else if (!passwordRegex.test(regPassword)) {
      newErrors.regPassword = "Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số.";
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
      const res = await registerRequest(regName, regEmail, regRole, regPassword);
      let msg = res.message || "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.";
      if (!msg.toLowerCase().includes("mã otp đã được gửi")) {
        msg = "Mã OTP đã được gửi. " + msg;
      }
      setSuccessMessage(msg);
      setCountdown(180);
      setResendCooldown(60);
      setShowOtpScreen(true);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrors({ global: err.message || "Đăng ký thất bại." });
    }
  };

  return (
    <section className="w-full min-h-dvh bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] font-sans">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-dvh">

        {/* ═══ LEFT HALF: GreenLife Brand Panel (desktop only) ═══ */}
        <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden"
          style={{
            background: theme === "dark"
              ? "linear-gradient(135deg, #064e3b 0%, #134e4a 40%, #1c1917 100%)"
              : "linear-gradient(135deg, #6ee7b7 0%, #2dd4bf 35%, #059669 70%, #065f46 100%)"
          }}
        >
          {/* Ambient glow orbs — low opacity, no animation */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)" }}
          />
          <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)" }}
          />
          {/* Decorative leaf rings — CSS only, reduced-motion safe */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
            <div className="w-[600px] h-[600px] rounded-full border border-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.07]">
            <div className="w-[400px] h-[400px] rounded-full border border-white" />
          </div>

          {/* Brand content */}
          <div className="relative z-10 flex flex-col items-center text-center px-10 max-w-md">
            {/* Logo icon */}
            <div className="mb-6 p-5 rounded-3xl"
              style={{
                background: theme === "dark" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.2)",
                border: theme === "dark" ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(255,255,255,0.35)"
              }}
            >
              <Leaf className="w-14 h-14" style={{ color: theme === "dark" ? "#6ee7b7" : "#ffffff" }} />
            </div>

            {/* Brand name */}
            <h1 className="text-3xl xl:text-4xl font-display font-bold tracking-tight mb-2"
              style={{ color: theme === "dark" ? "#f0fdf4" : "#ffffff" }}
            >
              GreenLife Portal
            </h1>

            {/* Tagline */}
            <p className="text-base font-medium mb-1"
              style={{ color: theme === "dark" ? "#a7f3d0" : "#ecfdf5" }}
            >
              Nuôi dưỡng hệ sinh thái xanh của bạn
            </p>
            <p className="text-sm leading-relaxed mb-8"
              style={{ color: theme === "dark" ? "#6ee7b7" : "rgba(236,253,245,0.85)" }}
            >
              Quản lý tài khoản, theo dõi dịch vụ chăm sóc cây và tích lũy điểm carbon từ một nơi.
            </p>

            {/* 3 benefits */}
            <div className="w-full flex flex-col gap-3 text-left">
              {[
                { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />, text: "Theo dõi đơn hàng và dịch vụ chăm sóc cây" },
                { icon: <Leaf className="w-4 h-4 shrink-0" />, text: "Lưu lịch sử chẩn đoán bệnh cây bằng AI" },
                { icon: <Award className="w-4 h-4 shrink-0" />, text: "Quản lý điểm thưởng carbon và tài khoản" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{
                    background: theme === "dark" ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.15)",
                    border: theme === "dark" ? "1px solid rgba(52,211,153,0.15)" : "1px solid rgba(255,255,255,0.25)"
                  }}
                >
                  <span style={{ color: theme === "dark" ? "#34d399" : "#ecfdf5" }}>{item.icon}</span>
                  <span className="text-sm font-medium" style={{ color: theme === "dark" ? "#d1fae5" : "#f0fdf4" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT HALF: Auth Form Canvas ═══ */}
        <div className="w-full min-h-dvh flex overflow-y-auto px-4 py-6 sm:px-6"
          style={{
            background: theme === "dark"
              ? "var(--gl-bg-page, #111827)"
              : "#f0fdf4"
          }}
        >
          <div className="w-full max-w-[500px] mx-auto my-auto rounded-3xl p-8 sm:p-10 space-y-5"
            style={{
              background: theme === "dark" ? "var(--gl-bg-surface, #1f2937)" : "#ffffff",
              border: theme === "dark" ? "1px solid var(--gl-border, rgba(255,255,255,0.1))" : "1px solid #d1fae5",
              boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(6,95,70,0.10)"
            }}
          >
              {/* Form heading — mobile brand substitute */}
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-3 lg:hidden">
                  <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">GreenLife Portal</span>
                </div>
                <h2 className="text-xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight">Chào mừng trở lại</h2>
                <p className="text-xs text-[var(--gl-text-secondary)] mt-1">Đăng nhập để tiếp tục sử dụng GreenLife.</p>
              </div>

            {/* Custom Tabs */}
            <div className="flex border-b border-[var(--gl-border-subtle)] pb-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrors({});
                }}
                className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "login"
                    ? "text-[var(--gl-accent)] border-b-2 border-[var(--gl-accent)]"
                    : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)]"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập tài khoản
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrors({});
                }}
                className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "register"
                    ? "text-[var(--gl-accent)] border-b-2 border-[var(--gl-accent)]"
                    : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)]"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản
              </button>
            </div>

            {errors.global && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[var(--gl-danger)] text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errors.global}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[var(--gl-accent)] text-xs rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <h2 className="sr-only">Đăng nhập</h2>
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                    Địa chỉ Email:
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ten.ban@greenlife.vn"
                    className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                  />
                  {errors.loginEmail && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.loginEmail}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="login-password" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                      Mật khẩu:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("forgot-password");
                        setForgotStep(1);
                        setErrors({});
                      }}
                      className="text-[11px] text-[var(--gl-accent)] hover:underline transition-all font-mono bg-transparent border-0 cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 pr-10 text-xs focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] bg-transparent border-0 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.loginPassword}</p>
                  )}
                </div>

                <p className="text-[10px] text-[var(--gl-text-muted)] leading-normal">
                  (*) Tài khoản được quản lý trong hệ sinh thái của GreenLife, cam kết không cung cấp thông tin cho bên thứ ba.
                </p>

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] ${
                    isLoginLoading
                      ? "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] cursor-not-allowed opacity-60"
                      : "bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 cursor-pointer"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  {isLoginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[var(--gl-border-subtle)]"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-[var(--gl-text-muted)] font-mono uppercase tracking-wider">hoặc</span>
                  <div className="flex-grow border-t border-[var(--gl-border-subtle)]"></div>
                </div>

                <div className="flex justify-center w-full mt-2">
                  {isGoogleClientIdValid(GOOGLE_CLIENT_ID) ? (
                    <div className="relative w-full max-w-[384px] min-h-[44px] overflow-hidden rounded-xl flex items-center justify-center">
                      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                          onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                              try {
                                await loginWithGoogle(credentialResponse.credential);
                                setCurrentPage("home");
                              } catch (err: any) {
                                setErrors({ global: err.message || "Đăng nhập Google thất bại." });
                              }
                            }
                          }}
                          onError={() => {
                            setErrors({ global: "Lỗi kết nối hoặc xác thực Google." });
                          }}
                          text="continue_with"
                          theme="filled_black"
                          shape="rectangular"
                          size="large"
                          width="384"
                        />
                      </GoogleOAuthProvider>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] font-medium rounded-xl pointer-events-none text-sm select-none">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M5.2662 9.7653C6.1995 6.9363 8.854 4.8571 12 4.8571C13.6952 4.8571 15.2238 5.4857 16.3905 6.5143L19.781 3.1238C17.7048 1.1905 14.9905 0 12 0C7.3048 0 3.2571 2.7238 1.3238 6.6952L5.2662 9.7653Z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.4952 12.2762C23.4952 11.5143 23.4286 10.7524 23.3 10.0286H12V14.6286H18.4571C18.181 16.1429 17.2952 17.4381 16.019 18.2952L19.781 21.2095C21.9905 19.1714 23.4952 16.0095 23.4952 12.2762Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.2662 14.2347C5.019 13.4952 4.8857 12.7143 4.8857 11.9048C4.8857 11.0952 5.019 10.3143 5.2662 9.5762L1.3238 6.5048C0.4762 8.2476 0 10.1905 0 12.2381C0 14.2857 0.4762 16.2286 1.3238 17.9714L5.2662 14.2347Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24C15.2429 24 17.9619 22.9238 19.781 21.0952L16.019 18.181C14.981 18.8762 13.6286 19.2952 12 19.2952C8.854 19.2952 6.1995 17.2157 5.2662 14.3867L1.3238 17.4586C3.2571 21.4305 7.3048 24 12 24Z"
                          />
                        </svg>
                        <span>Tiếp tục với Google</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[var(--gl-text-muted)] text-xs text-center py-2.5 px-4 border border-dashed border-[var(--gl-border-subtle)] rounded-xl bg-[var(--gl-bg-muted)] w-full max-w-[384px]">
                      Đăng nhập Google chưa được cấu hình trong môi trường này.
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER FORM WITH OTP VERIFICATION */}
            {activeTab === "register" && showOtpScreen && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-[var(--gl-text-primary)] font-bold text-sm">Xác thực mã OTP</h3>
                  <p className="text-[11px] text-[var(--gl-text-muted)]">
                    Một mã xác minh 6 số đã được gửi về Gmail <span className="text-[var(--gl-accent)] font-mono font-bold">{regEmail}</span>.
                  </p>
                </div>

                {/* 6 Digit Inputs */}
                <div className="flex justify-between gap-2 py-2">
                  {otpCode.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-10 h-12 sm:w-12 sm:h-12 text-center bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl text-lg font-bold focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Countdown and Resend */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--gl-text-muted)]">Hiệu lực còn lại:</span>
                  <span className="text-[var(--gl-accent)] font-bold">{countdown}s</span>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md active:scale-[0.98]"
                >
                  <Shield className="h-4 w-4" />
                  Xác minh kích hoạt tài khoản
                </button>

                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--gl-border-subtle)]">
                  <button
                    type="button"
                    disabled={isResendDisabled}
                    onClick={handleResendOtp}
                    className={`w-full min-h-[44px] text-center text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer ${
                      isResendDisabled
                        ? "text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)] border border-[var(--gl-border-subtle)]"
                        : "text-[var(--gl-accent)] hover:underline bg-[var(--gl-accent-soft)] border border-[var(--gl-accent)]/30"
                    }`}
                  >
                    {resendCooldown > 0 ? `Gửi lại mã OTP qua Email (${resendCooldown}s)` : "Gửi lại mã OTP qua Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOtpScreen(false)}
                    className="w-full text-center text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] text-xs py-1"
                  >
                    Quay lại trang Đăng ký
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {activeTab === "register" && !showOtpScreen && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <h2 className="sr-only">Đăng ký</h2>
                {/* Họ tên */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                    Họ và tên:
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                  />
                  {errors.regName && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.regName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                    Địa chỉ Email:
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email.cua.ban@domain.com"
                    className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                  />
                  {errors.regEmail && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.regEmail}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                    Mật khẩu:
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, 1 chữ, 1 số"
                    className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                  />
                  {errors.regPassword && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.regPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-confirm-password" className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                    Xác nhận mật khẩu:
                  </label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                  />
                  {errors.regConfirmPassword && (
                    <p className="text-[10px] text-[var(--gl-danger)]">{errors.regConfirmPassword}</p>
                  )}
                </div>

                <p className="text-[10px] text-[var(--gl-text-muted)] leading-normal">
                  Bằng cách nhấp vào nút Đăng ký, bạn đồng ý với Quy chế sử dụng nguồn lực xanh của Hợp tác xã GreenLife.
                </p>

                <button
                  type="submit"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  Gửi mã OTP
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[var(--gl-border-subtle)]"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-[var(--gl-text-muted)] font-mono uppercase tracking-wider">hoặc</span>
                  <div className="flex-grow border-t border-[var(--gl-border-subtle)]"></div>
                </div>

                <div className="flex justify-center w-full mt-2">
                  {isGoogleClientIdValid(GOOGLE_CLIENT_ID) ? (
                    <div className="relative w-full max-w-[384px] min-h-[44px] overflow-hidden rounded-xl flex items-center justify-center">
                      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                          onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                              try {
                                await loginWithGoogle(credentialResponse.credential);
                                setCurrentPage("home");
                              } catch (err: any) {
                                setErrors({ global: err.message || "Đăng nhập Google thất bại." });
                              }
                            }
                          }}
                          onError={() => {
                            setErrors({ global: "Lỗi kết nối hoặc xác thực Google." });
                          }}
                          text="continue_with"
                          theme="filled_black"
                          shape="rectangular"
                          size="large"
                          width="384"
                        />
                      </GoogleOAuthProvider>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] font-medium rounded-xl pointer-events-none text-sm select-none">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M5.2662 9.7653C6.1995 6.9363 8.854 4.8571 12 4.8571C13.6952 4.8571 15.2238 5.4857 16.3905 6.5143L19.781 3.1238C17.7048 1.1905 14.9905 0 12 0C7.3048 0 3.2571 2.7238 1.3238 6.6952L5.2662 9.7653Z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.4952 12.2762C23.4952 11.5143 23.4286 10.7524 23.3 10.0286H12V14.6286H18.4571C18.181 16.1429 17.2952 17.4381 16.019 18.2952L19.781 21.2095C21.9905 19.1714 23.4952 16.0095 23.4952 12.2762Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.2662 14.2347C5.019 13.4952 4.8857 12.7143 4.8857 11.9048C4.8857 11.0952 5.019 10.3143 5.2662 9.5762L1.3238 6.5048C0.4762 8.2476 0 10.1905 0 12.2381C0 14.2857 0.4762 16.2286 1.3238 17.9714L5.2662 14.2347Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24C15.2429 24 17.9619 22.9238 19.781 21.0952L16.019 18.181C14.981 18.8762 13.6286 19.2952 12 19.2952C8.854 19.2952 6.1995 17.2157 5.2662 14.3867L1.3238 17.4586C3.2571 21.4305 7.3048 24 12 24Z"
                          />
                        </svg>
                        <span>Tiếp tục với Google</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[var(--gl-text-muted)] text-xs text-center py-2.5 px-4 border border-dashed border-[var(--gl-border-subtle)] rounded-xl bg-[var(--gl-bg-muted)] w-full max-w-[384px]">
                      Đăng nhập Google chưa được cấu hình trong môi trường này.
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD FORM */}
            {activeTab === "forgot-password" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--gl-border-subtle)] pb-2.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setErrors({});
                    }}
                    className="text-xs text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-all cursor-pointer flex items-center gap-1 bg-transparent border-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Đăng nhập
                  </button>
                </div>

                {forgotStep === 1 && (
                  <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-[var(--gl-text-primary)] font-bold text-sm">Quên mật khẩu</h3>
                      <p className="text-[11px] text-[var(--gl-text-muted)]">
                        Nhập địa chỉ email của bạn để nhận mã OTP đặt lại mật khẩu.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                        Địa chỉ Email:
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="ten.ban@greenlife.vn"
                        className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 text-xs focus:outline-none transition-all"
                      />
                      {errors.forgotEmail && (
                        <p className="text-[10px] text-[var(--gl-danger)]">{errors.forgotEmail}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md active:scale-[0.98] border-0"
                    >
                      Gửi mã OTP qua Email
                    </button>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleForgotOtpSubmit} className="space-y-5">
                    <div className="text-center space-y-1">
                      <h3 className="text-[var(--gl-text-primary)] font-bold text-sm">Xác thực mã OTP</h3>
                      <p className="text-[11px] text-[var(--gl-text-muted)]">
                        Nhập mã xác minh 6 số đã được gửi đến email <span className="text-[var(--gl-accent)] font-mono font-bold">{forgotEmail}</span>.
                      </p>
                    </div>

                    {/* 6 Digit Inputs */}
                    <div className="flex justify-between gap-2 py-2">
                      {forgotOtpCode.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={data}
                          onChange={(e) => {
                            if (isNaN(Number(e.target.value))) return;
                            const newOtp = [...forgotOtpCode];
                            newOtp[index] = e.target.value;
                            setForgotOtpCode(newOtp);
                            if (e.target.value !== "" && e.target.nextSibling) {
                              (e.target.nextSibling as HTMLInputElement).focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && forgotOtpCode[index] === "" && e.currentTarget.previousSibling) {
                              (e.currentTarget.previousSibling as HTMLInputElement).focus();
                            }
                          }}
                          className="w-10 h-12 sm:w-12 sm:h-12 text-center bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl text-lg font-bold focus:outline-none transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[var(--gl-text-muted)]">Hiệu lực còn lại:</span>
                      <span className="text-[var(--gl-accent)] font-bold">{forgotCountdown}s</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md active:scale-[0.98] border-0"
                    >
                      <Shield className="h-4 w-4" />
                      Xác minh OTP đặt lại mật khẩu
                    </button>

                    <button
                      type="button"
                      disabled={isForgotResendDisabled}
                      onClick={handleForgotResendOtp}
                      className={`w-full min-h-[44px] text-center text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer border-0 ${
                        isForgotResendDisabled
                          ? "text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)] border border-[var(--gl-border-subtle)]"
                          : "text-[var(--gl-accent)] hover:underline bg-[var(--gl-accent-soft)] border border-[var(--gl-accent)]/30"
                      }`}
                    >
                      {forgotResendCooldown > 0 ? `Gửi lại mã OTP (${forgotResendCooldown}s)` : "Gửi lại mã OTP"}
                    </button>
                  </form>
                )}

                {forgotStep === 3 && (
                  <form onSubmit={handleForgotResetPasswordSubmit} className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-[var(--gl-text-primary)] font-bold text-sm">Thiết lập mật khẩu mới</h3>
                      <p className="text-[11px] text-[var(--gl-text-muted)]">
                        Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                        Mật khẩu mới:
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự, 1 chữ, 1 số"
                          className="w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-3 px-4 pr-10 text-xs focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] bg-transparent border-0 cursor-pointer p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.forgotNewPassword && (
                        <p className="text-[10px] text-[var(--gl-danger)]">{errors.forgotNewPassword}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md active:scale-[0.98] border-0"
                    >
                      Xác nhận đặt lại mật khẩu
                    </button>
                  </form>
                )}
              </div>
            )}

            </div>
          </div>
        </div>
    </section>
    );
  };
export default AuthView;
