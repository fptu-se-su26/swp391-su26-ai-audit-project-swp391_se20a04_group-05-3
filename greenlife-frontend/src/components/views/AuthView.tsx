import React, { useState } from "react";
import { User, Mail, ShieldAlert, Sparkles, Key, LogIn, UserPlus, Eye, EyeOff, Shield } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { AuthService } from "../../services/authService";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;


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
  const { login, register, registerRequest, verifyRegistrationOTP, loginWithGoogle } = useAppContext();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">("login");

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
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState<string[]>(Array(6).fill(""));
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotCountdown, setForgotCountdown] = useState(180);
  const [isForgotResendDisabled, setIsForgotResendDisabled] = useState(true);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              await loginWithGoogle(response.credential);
              setCurrentPage("home");
            } catch (err: any) {
              setErrors({ global: err.message || "Đăng nhập bằng Google thất bại." });
            }
          }
        });
        
        const loginBtn = document.getElementById("google-signin-btn-login");
        if (loginBtn) {
          google.accounts.id.renderButton(loginBtn, {
            theme: "outline",
            size: "large",
            width: 384,
            text: "signin_with",
            shape: "rectangular"
          });
        }

        const registerBtn = document.getElementById("google-signin-btn-register");
        if (registerBtn) {
          google.accounts.id.renderButton(registerBtn, {
            theme: "outline",
            size: "large",
            width: 384,
            text: "signup_with",
            shape: "rectangular"
          });
        }
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
  }, [activeTab]);



  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpScreen && countdown > 0) {
      setIsResendDisabled(true);
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [showOtpScreen, countdown]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === "forgot-password" && forgotStep === 2 && forgotCountdown > 0) {
      setIsForgotResendDisabled(true);
      timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    } else if (forgotCountdown === 0) {
      setIsForgotResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [activeTab, forgotStep, forgotCountdown]);

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
      setIsResendDisabled(true);
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
      setIsForgotResendDisabled(true);
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
      
      if (actualUser) {
        if (actualUser.role === "admin") {
          setCurrentPage("admin-dashboard");
        } else if (actualUser.is_seller) {
          setCurrentPage("store-dashboard");
        } else {
          setCurrentPage("customer-dashboard");
        }
      } else {
        throw new Error("Không thể tải thông tin đăng nhập.");
      }
    } catch (err: any) {
      let errMsg = err.message || "Lỗi kết nối cổng xác thực hoặc thông tin mật khẩu không chính xác.";
      if (!errMsg.toLowerCase().includes("sai")) {
        errMsg += " (Thông tin sai)";
      }
      setErrors({ global: errMsg });
      toast.error(errMsg);
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
      setShowOtpScreen(true);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrors({ global: err.message || "Đăng ký thất bại." });
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
              Đăng nhập tài khoản
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
              Đăng ký tài khoản
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
              <h2 className="sr-only">Đăng nhập</h2>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-500" />
                  Địa chỉ Email:
                </label>
                <input
                  id="login-email"
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
                  <label htmlFor="login-password" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-stone-500" />
                    Mật khẩu:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot-password");
                      setForgotStep(1);
                      setErrors({});
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-all font-mono bg-transparent border-0 cursor-pointer"
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
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 pr-10 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 bg-transparent border-0 cursor-pointer"
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
                Đăng nhập
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-850"></div>
                <span className="flex-shrink mx-4 text-[10px] text-stone-500 font-mono uppercase tracking-wider">hoặc</span>
                <div className="flex-grow border-t border-stone-850"></div>
              </div>

              <div className="flex justify-center w-full mt-2">
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
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width="384"
                  />
                </GoogleOAuthProvider>
              </div>


            </form>
          )}

          {/* TAB 2: REGISTER FORM WITH OTP VERIFICATION */}
          {activeTab === "register" && showOtpScreen && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-stone-300 font-bold text-sm">Xác thực mã OTP</h3>
                <p className="text-[11px] text-stone-500">
                  Một mã xác minh 6 số đã được gửi về Gmail <span className="text-emerald-400 font-mono font-bold">{regEmail}</span>.
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
                    className="w-12 h-12 text-center bg-stone-900 text-stone-100 border border-stone-800 focus:border-emerald-500/60 rounded-xl text-lg font-bold focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Countdown and Resend */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-500">Hiệu lực còn lại:</span>
                <span className="text-emerald-400 font-bold">{countdown}s</span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                <Shield className="h-4 w-4" />
                Xác minh kích hoạt tài khoản
              </button>

              <div className="flex flex-col gap-2 pt-2 border-t border-stone-850">
                <button
                  type="button"
                  disabled={isResendDisabled}
                  onClick={handleResendOtp}
                  className={`w-full text-center text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer ${
                    isResendDisabled
                      ? "text-stone-600 bg-stone-950 border border-stone-900"
                      : "text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 hover:border-emerald-500/50"
                  }`}
                >
                  Gửi lại mã OTP qua Email
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpScreen(false)}
                  className="w-full text-center text-stone-500 hover:text-stone-400 text-xs py-1"
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
                <label htmlFor="reg-name" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-stone-500" />
                  Họ và tên:
                </label>
                <input
                  id="reg-name"
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
                <label htmlFor="reg-email" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-500" />
                  Địa chỉ Email:
                </label>
                <input
                  id="reg-email"
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

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Mật khẩu:
                </label>
                <input
                  id="reg-password"
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
                <label htmlFor="reg-confirm-password" className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-stone-500" />
                  Xác nhận mật khẩu:
                </label>
                <input
                  id="reg-confirm-password"
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
                Gửi mã OTP
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-850"></div>
                <span className="flex-shrink mx-4 text-[10px] text-stone-500 font-mono uppercase tracking-wider">hoặc</span>
                <div className="flex-grow border-t border-stone-850"></div>
              </div>

              <div className="flex justify-center w-full mt-2">
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
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width="384"
                  />
                </GoogleOAuthProvider>
              </div>

            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD FORM */}
          {activeTab === "forgot-password" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-850 pb-2.5 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrors({});
                  }}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-all cursor-pointer flex items-center gap-1 bg-transparent border-0"
                >
                  &larr; Quay lại Đăng nhập
                </button>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-stone-300 font-bold text-sm">Quên mật khẩu</h3>
                    <p className="text-[11px] text-stone-500">
                      Nhập địa chỉ email của bạn để nhận mã OTP đặt lại mật khẩu.
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
                      placeholder="ten.ban@greenlife.vn"
                      className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                    />
                    {errors.forgotEmail && (
                      <p className="text-[10px] text-rose-500">{errors.forgotEmail}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border-0"
                  >
                    Gửi mã OTP qua Email
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleForgotOtpSubmit} className="space-y-5">
                  <div className="text-center space-y-1">
                    <h3 className="text-stone-300 font-bold text-sm">Xác thực mã OTP</h3>
                    <p className="text-[11px] text-stone-500">
                      Nhập mã xác minh 6 số đã được gửi đến email <span className="text-emerald-400 font-mono font-bold">{forgotEmail}</span>.
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
                        className="w-12 h-12 text-center bg-stone-900 text-stone-100 border border-stone-800 focus:border-emerald-500/60 rounded-xl text-lg font-bold focus:outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-500">Hiệu lực còn lại:</span>
                    <span className="text-emerald-400 font-bold">{forgotCountdown}s</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border-0"
                  >
                    <Shield className="h-4 w-4" />
                    Xác minh OTP đặt lại mật khẩu
                  </button>

                  <button
                    type="button"
                    disabled={isForgotResendDisabled}
                    onClick={handleForgotResendOtp}
                    className={`w-full text-center text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer border-0 ${
                      isForgotResendDisabled
                        ? "text-stone-600 bg-stone-950 border border-stone-900"
                        : "text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 hover:border-emerald-500/50"
                    }`}
                  >
                    Gửi lại mã OTP
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleForgotResetPasswordSubmit} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-stone-300 font-bold text-sm">Thiết lập mật khẩu mới</h3>
                    <p className="text-[11px] text-stone-500">
                      Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-stone-500" />
                      Mật khẩu mới:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự, 1 chữ, 1 số"
                        className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 pr-10 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 bg-transparent border-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.forgotNewPassword && (
                      <p className="text-[10px] text-rose-500">{errors.forgotNewPassword}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/25 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border-0"
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
  );
};
