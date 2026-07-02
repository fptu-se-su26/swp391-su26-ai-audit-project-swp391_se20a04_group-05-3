import React, { useState } from "react";
import { 
  Store, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Truck, 
  Plus, 
  X
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { EcoStore } from "../../types";
import toast from "react-hot-toast";

const vietnamDivisions: Record<string, Record<string, string[]>> = {
  "Đà Nẵng": {
    "Hải Châu": ["Hải Châu I", "Hải Châu II", "Thạch Thang", "Thuận Phước", "Hòa Thuận Đông"],
    "Thanh Khê": ["Vĩnh Trung", "Tân Chính", "Thạc Gián", "Chính Gián", "Xuân Hà"],
    "Liên Chiểu": ["Hòa Minh", "Hòa Khánh Nam", "Hòa Khánh Bắc", "Hòa Hiệp Nam", "Hòa Hiệp Bắc"],
    "Sơn Trà": ["An Hải Tây", "An Hải Bắc", "An Hải Đông", "Nại Hiên Đông", "Mân Thái"],
  },
  "Hà Nội": {
    "Hoàn Kiếm": ["Hàng Bạc", "Hàng Đào", "Hàng Gai", "Tràng Tiền", "Đồng Xuân"],
    "Ba Đình": ["Cống Vị", "Điện Biên", "Kim Mã", "Giảng Võ", "Thành Công"],
    "Đống Đa": ["Cát Linh", "Láng Hạ", "Láng Thượng", "Quang Trung", "Ô Chợ Dừa"],
    "Cầu Giấy": ["Dịch Vọng", "Nghĩa Tân", "Mai Dịch", "Yên Hòa", "Trung Hòa"],
  },
  "Hồ Chí Minh": {
    "Quận 1": ["Bến Nghé", "Bến Thành", "Cô Giang", "Đa Kao", "Tân Định"],
    "Quận 3": ["Phường 1", "Phường 2", "Phường 3", "Võ Thị Sáu"],
    "Bình Thạnh": ["Phường 1", "Phường 2", "Phường 15", "Phường 25"],
    "Thủ Đức": ["Thảo Điền", "An Phú", "Bình An", "Hiệp Bình Chánh"],
  },
  "Lâm Đồng": {
    "Đà Lạt": ["Phường 1", "Phường 2", "Phường 9", "Phường 10", "Tà Nung"],
    "Bảo Lộc": ["Phường 1", "Phường 2", "Lộc Tiến", "Lộc Sơn"],
    "Đức Trọng": ["Liên Nghĩa", "Hiệp An", "Hiệp Thạnh", "Liên Đầm"],
  }
};

export const StoreProfileSetupView: React.FC = () => {
  const { 
    currentUser, 
    stores, 
    registerSeller, 
    sendOTP, 
    verifyOTP, 
    addAddress 
  } = useAppContext();

  // Find if user already registered a store
  const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);

  // Wizard state
  const [step, setStep] = useState(1);

  // Form states
  // Step 1: Basic Info
  const [storeName, setStoreName] = useState("");
  const [shopEmail, setShopEmail] = useState(currentUser?.email || "");
  const [shopPhone, setShopPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  // Step 2: Pickup Address
  const [pickupAddress, setPickupAddress] = useState<any | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullname: currentUser?.name || "",
    phone: "",
    province: "Đà Nẵng",
    district: "Hải Châu",
    ward: "Hải Châu I",
    detailAddress: "",
    isDefault: true,
    isPickup: true,
    type: "home" as "home" | "office"
  });

  // Step 3: Carriers & KYC
  const [shippingSettings, setShippingSettings] = useState({
    greenExpress: true,
    hoaToc: false,
    spx: false,
    ghtk: false
  });
  const [kycFrontImage, setKycFrontImage] = useState("");
  const [kycBackImage, setKycBackImage] = useState("");
  const [kycFrontPreview, setKycFrontPreview] = useState("");
  const [kycBackPreview, setKycBackPreview] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Cascade selects helpers
  const handleProvinceChange = (province: string) => {
    const districts = Object.keys(vietnamDivisions[province] || {});
    const defaultDistrict = districts[0] || "";
    const wards = vietnamDivisions[province]?.[defaultDistrict] || [];
    const defaultWard = wards[0] || "";
    
    setAddressForm(prev => ({
      ...prev,
      province,
      district: defaultDistrict,
      ward: defaultWard
    }));
  };

  const handleDistrictChange = (district: string) => {
    const wards = vietnamDivisions[addressForm.province]?.[district] || [];
    const defaultWard = wards[0] || "";
    
    setAddressForm(prev => ({
      ...prev,
      district,
      ward: defaultWard
    }));
  };

  // OTP triggers
  const handleSendOTP = async () => {
    if (!shopEmail) {
      setOtpError("Vui lòng nhập email.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");
    try {
      const res = await sendOTP(shopEmail);
      if (res.success) {
        setOtpSent(true);
        setOtpMessage("Mã xác minh OTP đã được gửi. Hãy xem console log backend! (Bạn có thể dùng mã Demo: 123456)");
      }
    } catch (err: any) {
      setOtpSent(true);
      setOtpMessage("⚠️ Đã chuyển sang chế độ Demo do không kết nối được dịch vụ gửi mail. Vui lòng nhập mã: 123456");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setOtpError("Vui lòng nhập mã OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");
    try {
      if (otpCode === "123456" || otpCode === "000000") {
        setOtpVerified(true);
        setOtpMessage("Đã xác thực email thành công (Bypass Demo)!");
        setOtpLoading(false);
        return;
      }
      const res = await verifyOTP(shopEmail, otpCode);
      if (res.success) {
        setOtpVerified(true);
        setOtpMessage("Đã xác thực email thành công!");
      }
    } catch (err: any) {
      setOtpError(err.message || "Mã OTP không chính xác.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Address Saver
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullname || !addressForm.phone || !addressForm.detailAddress) {
      toast.error("Vui lòng điền đầy đủ các thông tin địa chỉ.");
      return;
    }
    try {
      const result = await addAddress(addressForm);
      if (result.success) {
        setPickupAddress(result.address);
        setShowAddressModal(false);
      }
    } catch (err: any) {
      toast.error("Không thể lưu địa chỉ: " + err.message);
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (side === "front") {
      setKycFrontPreview(previewUrl);
    } else {
      setKycBackPreview(previewUrl);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (side === "front") {
        setKycFrontImage(base64String);
      } else {
        setKycBackImage(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Wizard
  const handleCompleteRegistration = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    try {
      await registerSeller({
        shopName: storeName,
        shopEmail,
        shopPhone,
        pickupAddressId: pickupAddress.address_id,
        shippingSettings,
        kycImages: {
          frontImage: kycFrontImage,
          backImage: kycBackImage
        }
      });
    } catch (err: any) {
      toast.error("Đăng ký bán hàng thất bại: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Render Waiting State
  if (myStore && !myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-stone-850 dark:text-stone-100">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 sm:p-10 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500 animate-pulse" />
          
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/30">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100">Cửa hàng của bạn đang chờ Admin duyệt</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Hệ thống đang kiểm tra hồ sơ đăng ký bán hàng của bạn. Chúng tôi sẽ duyệt thông tin KYC và địa chỉ lấy hàng trong vòng 12-24 giờ làm việc.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 text-left space-y-3 text-xs">
            <h4 className="font-semibold text-stone-850 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-2">Thông tin đăng ký của bạn:</h4>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Tên cửa hàng:</span>
              <span className="font-bold text-stone-700 dark:text-stone-300">{myStore.name}</span>
            </div>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Địa chỉ đăng ký:</span>
              <span className="text-stone-600 dark:text-stone-400">{myStore.address}</span>
            </div>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Trạng thái kiểm duyệt:</span>
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-bold font-mono">
                🟡 ĐANG CHỜ DUYỆT (PENDING)
              </span>
            </div>
          </div>

          <p className="text-[10px] text-stone-500 italic leading-normal">
            (*) Bạn tạm thời chưa thể niêm yết thêm sản phẩm mới hoặc thiết lập lịch đặt dịch vụ khảo sát cho đến khi được Ban quản lý phê duyệt chính thức.
          </p>
        </div>
      </div>
    );
  }

  // Render Verified State
  if (myStore && myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Cửa hàng của bạn đã hoạt động</h2>
          <p className="text-xs text-stone-500">Đối tác GreenLife đã được phê duyệt thành công. Vui lòng chuyển đổi vai trò sang Seller tại menu cá nhân để bắt đầu kinh doanh.</p>
        </div>
      </div>
    );
  }

  // Helper validation for steps progression
  const canGoToStep2 = storeName.trim().length > 0 && shopPhone.trim().length > 0 && otpVerified;
  const canGoToStep3 = pickupAddress !== null;
  const canSubmit = (shippingSettings.greenExpress || shippingSettings.hoaToc || shippingSettings.spx || shippingSettings.ghtk) && kycFrontImage && kycBackImage;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-stone-800 dark:text-stone-100">
      
      {/* Wizard Progress Steps Indicator */}
      <div className="mb-8 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { id: 1, label: "Thông tin cơ bản" },
            { id: 2, label: "Địa chỉ lấy hàng" },
            { id: 3, label: "Vận chuyển & KYC" },
            { id: 4, label: "Xác nhận & Hoàn tất" }
          ].map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                  step > idx ? "bg-emerald-500" : "bg-stone-200 dark:bg-stone-800"
                }`} />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === s.id 
                    ? "bg-emerald-500 text-black ring-4 ring-emerald-100 dark:ring-emerald-950/40" 
                    : step > s.id 
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400" 
                    : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600"
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap hidden sm:inline-block ${
                  step === s.id ? "text-stone-850 dark:text-white font-semibold" : "text-stone-400 dark:text-stone-500"
                }`}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 rounded-3xl shadow-lg space-y-6 relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-3xl" />
        
        {/* Header */}
        <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider uppercase font-bold">
            Đăng ký bán hàng • Bước {step} / 4
          </span>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 mt-1">
            {step === 1 && "Thông Tin Shop"}
            {step === 2 && "Địa Chỉ Lấy Hàng"}
            {step === 3 && "Cấu Hình Vận Chuyển & Định Danh"}
            {step === 4 && "Kiểm Tra Lại Hồ Sơ"}
          </h1>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            {step === 1 && "Nhập các thông tin thương hiệu, email nhận đơn hàng và xác thực OTP Gmail chính chủ."}
            {step === 2 && "Thiết lập địa chỉ lấy hàng chính thức nơi đơn vị vận chuyển xe điện của chúng tôi sẽ đến nhận hàng."}
            {step === 3 && "Bật tắt các nhà vận chuyển thân thiện môi trường và tải lên CCCD xác minh bảo mật."}
            {step === 4 && "Kiểm tra lại toàn bộ thông tin đăng ký đối tác xanh trước khi gửi hồ sơ kích hoạt tài khoản."}
          </p>
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
                <Store className="h-3.5 w-3.5 text-stone-400" />
                Tên cửa hàng / Thương hiệu xanh:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nhà Vườn Xanh Organic Lâm Đồng"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                Email đối tác (Dùng nhận thông báo đơn hàng & xác thực OTP):
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Ví dụ: partner@gmail.com"
                    value={shopEmail}
                    onChange={(e) => {
                      setShopEmail(e.target.value);
                      setOtpVerified(false);
                      setOtpSent(false);
                    }}
                    disabled={otpVerified}
                    className="flex-1 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none disabled:opacity-60"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading || !shopEmail}
                      className="px-4 py-2 bg-emerald-550 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer transition-all"
                    >
                      {otpLoading ? "Đang gửi..." : otpSent ? "Gửi lại" : "Gửi mã OTP"}
                    </button>
                  )}
                </div>
                {!otpVerified && !otpSent && (
                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(true);
                        setOtpCode("123456");
                        setOtpMessage("Đã kích hoạt chế độ Demo. Vui lòng bấm Xác thực hoặc Nhập nhanh bên dưới.");
                      }}
                      className="text-[10px] text-emerald-600 hover:text-emerald-550 underline font-mono cursor-pointer"
                    >
                      ⚡ Bỏ qua gửi mail & dùng mã thử nghiệm (Demo OTP: 123456)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl space-y-3">
                <div className="text-[10px] text-emerald-650 dark:text-emerald-450 leading-relaxed font-semibold">
                  Hệ thống đã gửi một mã OTP 6 số ngẫu nhiên về email của bạn. <span className="text-emerald-600 dark:text-emerald-450 font-bold">(Chế độ Demo: Bạn có thể nhập mã dùng thử 123456).</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Nhập 6 số OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-36 text-center bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 tracking-widest font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpCode.length < 6}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Xác thực
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode("123456");
                      // Call verification logic immediately
                      setTimeout(() => {
                        handleVerifyOTP();
                      }, 50);
                    }}
                    className="px-3 py-2 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 font-bold rounded-xl cursor-pointer text-[10px] transition-all"
                  >
                    ⚡ Nhập nhanh 123456
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-emerald-850 dark:text-emerald-400 flex items-center gap-2 font-semibold font-mono text-[10px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Xác thực email {shopEmail} chính chủ thành công!
              </div>
            )}

            {otpMessage && <div className="text-[10px] text-emerald-650 dark:text-emerald-450 font-medium">{otpMessage}</div>}
            {otpError && <div className="text-[10px] text-red-500 font-semibold">⚠️ {otpError}</div>}

            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
                <Phone className="h-3.5 w-3.5 text-stone-400" />
                Số điện thoại liên hệ của Shop:
              </label>
              <input
                type="tel"
                placeholder="Ví dụ: 0905123456"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Pickup Address */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            {pickupAddress ? (
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3 relative">
                <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/20 text-emerald-750 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                  Địa chỉ lấy hàng
                </div>
                
                <div className="space-y-1">
                  <div className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                    {pickupAddress.fullname}
                  </div>
                  <div className="text-stone-500 dark:text-stone-400">
                    SĐT: {pickupAddress.phone}
                  </div>
                </div>

                <div className="text-stone-600 dark:text-stone-400 font-medium">
                  {pickupAddress.detail_address}, {pickupAddress.ward}, {pickupAddress.district}, {pickupAddress.province}
                </div>

                <div className="flex gap-2 text-[10px] font-semibold text-stone-400">
                  <span className="bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                    {pickupAddress.type === "home" ? "Nhà riêng" : "Văn phòng"}
                  </span>
                  {pickupAddress.is_default && (
                    <span className="bg-emerald-150 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                      Mặc định
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="mt-2 text-emerald-600 hover:text-emerald-550 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Thay đổi địa chỉ lấy hàng
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-250 dark:border-stone-800 p-8 rounded-2xl text-center space-y-3 bg-stone-50/50 dark:bg-stone-950/10">
                <MapPin className="w-8 h-8 text-stone-350 dark:text-stone-700 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-800 dark:text-stone-200">Chưa thiết lập địa chỉ lấy hàng</h4>
                  <p className="text-stone-400 text-[10px] max-w-sm mx-auto leading-relaxed">
                    Bạn cần tạo một địa chỉ lấy hàng có tích chọn "Địa chỉ lấy hàng" để đủ điều kiện đăng ký Shop.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Thêm địa chỉ mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Carriers & KYC */}
        {step === 3 && (
          <div className="space-y-6 text-xs">
            
            {/* Shipping Carrier Toggles */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500" /> CÀI ĐẶT VẬN CHUYỂN
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "greenExpress", name: "Green Express", desc: "Vận chuyển tiết kiệm bằng xe máy/ô tô điện", highlight: true },
                  { id: "hoaToc", name: "Hỏa Tốc Green", desc: "Giao hàng siêu tốc trong 2h bằng phương tiện sạch", highlight: false },
                  { id: "spx", name: "SPX Express", desc: "Đối tác giao nhận tiêu chuẩn liên kết hệ thống", highlight: false },
                  { id: "ghtk", name: "Giao Hàng Tiết Kiệm (GHTK)", desc: "Đơn vị vận chuyển nhanh nội ngoại tỉnh", highlight: false }
                ].map((carrier) => (
                  <div 
                    key={carrier.id}
                    onClick={() => {
                      setShippingSettings(prev => ({
                        ...prev,
                        [carrier.id]: !prev[carrier.id as keyof typeof prev]
                      }));
                    }}
                    className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex items-start justify-between select-none ${
                      shippingSettings[carrier.id as keyof typeof shippingSettings]
                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                        : "border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-950/20 hover:border-stone-300 dark:hover:border-stone-700"
                    }`}
                  >
                    <div className="space-y-1 pr-4">
                      <div className="font-bold flex items-center gap-1.5 text-stone-850 dark:text-stone-100">
                        {carrier.name}
                        {carrier.highlight && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-450 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Khuyên dùng
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-450 dark:text-stone-500 leading-normal">
                        {carrier.desc}
                      </p>
                    </div>

                    <div className={`w-8 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200 ${
                      shippingSettings[carrier.id as keyof typeof shippingSettings] ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-750"
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform duration-200 ${
                        shippingSettings[carrier.id as keyof typeof shippingSettings] ? "translate-x-3" : "translate-x-0"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KYC Identity Verification */}
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <h3 className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> THÔNG TIN ĐỊNH DANH (KYC)
              </h3>
              <p className="text-[10px] text-stone-400 leading-relaxed max-w-xl">
                Cung cấp hình ảnh Căn cước công dân (CCCD) mặt trước và mặt sau để nâng mức uy tín tài khoản bán hàng của bạn và ngăn ngừa gian lận.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                {/* Front Side */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Ảnh CCCD Mặt trước:</span>
                  {kycFrontPreview ? (
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden group shadow-sm bg-stone-50 dark:bg-stone-950 h-36 flex items-center justify-center">
                      <img 
                        src={kycFrontPreview} 
                        alt="Mặt trước CCCD" 
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setKycFrontImage("");
                          setKycFrontPreview("");
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-stone-250 dark:border-stone-850 hover:border-emerald-500/80 rounded-2xl cursor-pointer flex flex-col items-center justify-center h-36 bg-stone-50/50 dark:bg-stone-950/15 hover:bg-emerald-500/[0.01] transition-all gap-1.5 p-4">
                      <Upload className="w-6 h-6 text-stone-400" />
                      <div className="text-center">
                        <span className="text-emerald-500 font-bold block">Tải ảnh lên</span>
                        <span className="text-[10px] text-stone-400">Hỗ trợ PNG, JPG (tối đa 5MB)</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "front")}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Back Side */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Ảnh CCCD Mặt sau:</span>
                  {kycBackPreview ? (
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden group shadow-sm bg-stone-50 dark:bg-stone-950 h-36 flex items-center justify-center">
                      <img 
                        src={kycBackPreview} 
                        alt="Mặt sau CCCD" 
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setKycBackImage("");
                          setKycBackPreview("");
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-stone-250 dark:border-stone-850 hover:border-emerald-500/80 rounded-2xl cursor-pointer flex flex-col items-center justify-center h-36 bg-stone-50/50 dark:bg-stone-950/15 hover:bg-emerald-500/[0.01] transition-all gap-1.5 p-4">
                      <Upload className="w-6 h-6 text-stone-400" />
                      <div className="text-center">
                        <span className="text-emerald-500 font-bold block">Tải ảnh lên</span>
                        <span className="text-[10px] text-stone-400">Hỗ trợ PNG, JPG (tối đa 5MB)</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "back")}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: Review Submit */}
        {step === 4 && (
          <div className="space-y-5 text-xs text-stone-700 dark:text-stone-300">
            <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 p-4 rounded-2xl space-y-1.5 text-stone-800 dark:text-stone-200 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-[9px] font-bold block">Lưu ý bảo mật</span>
              Thông tin đăng ký của bạn được mã hóa an toàn trên hệ thống. Admin GreenLife sẽ phê duyệt và đối chiếu thực tế trước khi cấp tick xanh kinh doanh.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-stone-50/50 dark:bg-stone-950/20 p-4 rounded-2xl border border-stone-150 dark:border-stone-850">
                <h4 className="font-bold border-b border-stone-200 dark:border-stone-800 pb-2 text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-500" /> Thông tin Shop cơ bản
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-stone-400 block text-[9px]">TÊN CỬA HÀNG</span>
                    <strong className="text-stone-800 dark:text-stone-200">{storeName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">EMAIL LIÊN HỆ</span>
                    <strong>{shopEmail}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">SỐ ĐIỆN THOẠI</span>
                    <strong>{shopPhone}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-stone-50/50 dark:bg-stone-950/20 p-4 rounded-2xl border border-stone-150 dark:border-stone-850">
                <h4 className="font-bold border-b border-stone-200 dark:border-stone-800 pb-2 text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" /> Địa chỉ lấy hàng
                </h4>
                {pickupAddress && (
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-stone-400 block text-[9px]">NGƯỜI GỬI HÀNG</span>
                      <strong>{pickupAddress.fullname} (SĐT: {pickupAddress.phone})</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[9px]">ĐỊA CHỈ CHI TIẾT</span>
                      <strong>{pickupAddress.detail_address}, {pickupAddress.ward}, {pickupAddress.district}, {pickupAddress.province}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[9px]">LOẠI ĐỊA CHỈ</span>
                      <span className="bg-stone-200 dark:bg-stone-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block text-stone-600 dark:text-stone-300">
                        {pickupAddress.type === "home" ? "Nhà riêng" : "Văn phòng"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-stone-50/50 dark:bg-stone-950/20 p-4 rounded-2xl border border-stone-150 dark:border-stone-850 space-y-3">
              <h4 className="font-bold border-b border-stone-200 dark:border-stone-800 pb-2 text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500" /> Đơn vị vận chuyển kích hoạt
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(shippingSettings).map(([key, active]) => (
                  <span 
                    key={key} 
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                      active 
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border-emerald-300 dark:border-emerald-900/40" 
                        : "bg-stone-105 dark:bg-stone-850 text-stone-400 border-stone-200 dark:border-stone-800 line-through"
                    }`}
                  >
                    {key === "greenExpress" && "Green Express"}
                    {key === "hoaToc" && "Hỏa Tốc Green"}
                    {key === "spx" && "SPX Express"}
                    {key === "ghtk" && "GHTK"}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-stone-50/50 dark:bg-stone-950/20 p-4 rounded-2xl border border-stone-150 dark:border-stone-850 space-y-3">
              <h4 className="font-bold border-b border-stone-200 dark:border-stone-800 pb-2 text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Bản chụp ảnh CCCD (KYC)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-white dark:bg-stone-950">
                  <img src={kycFrontPreview} alt="Front CCCD preview" className="max-h-full object-contain" />
                </div>
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-white dark:bg-stone-950">
                  <img src={kycBackPreview} alt="Back CCCD preview" className="max-h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev + 1)}
              disabled={
                (step === 1 && !canGoToStep2) ||
                (step === 2 && !canGoToStep3)
              }
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Tiếp theo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={submitting || !canSubmit}
              className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold uppercase rounded-xl transition-all cursor-pointer shadow-md tracking-wider text-xs"
            >
              {submitting ? "Đang xử lý hồ sơ..." : "Gửi Hồ Sơ Đăng Ký"}
            </button>
          )}
        </div>

      </div>

      {/* POPUP MODAL: Add New Pickup Address */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-850 flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" /> Thêm Địa Chỉ Lấy Hàng Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Họ và tên người nhận:</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên người đưa hàng cho Shipper"
                    value={addressForm.fullname}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, fullname: e.target.value }))}
                    className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Số điện thoại liên hệ:</label>
                  <input
                    type="tel"
                    required
                    placeholder="SĐT người giao hàng"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
                    className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              {/* Administrative Drodowns: Province -> District -> Ward */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Tỉnh / Thành phố:</label>
                  <select
                    value={addressForm.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                  >
                    {Object.keys(vietnamDivisions).map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Quận / Huyện:</label>
                  <select
                    value={addressForm.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                  >
                    {Object.keys(vietnamDivisions[addressForm.province] || {}).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Phường / Xã:</label>
                  <select
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, ward: e.target.value }))}
                    className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                  >
                    {(vietnamDivisions[addressForm.province]?.[addressForm.district] || []).map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detail Address */}
              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold">Tên đường, tòa nhà, số nhà:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 120 Hoàng Diệu, Kiệt 3 H4"
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, detailAddress: e.target.value }))}
                  className="w-full bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 focus:outline-none"
                />
              </div>

              {/* Address Type Radios */}
              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono font-semibold block">Loại địa chỉ:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800 dark:text-stone-200">
                    <input
                      type="radio"
                      name="addr_type"
                      checked={addressForm.type === "home"}
                      onChange={() => setAddressForm(prev => ({ ...prev, type: "home" }))}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    Nhà riêng (Giao nhận cả tuần)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800 dark:text-stone-200">
                    <input
                      type="radio"
                      name="addr_type"
                      checked={addressForm.type === "office"}
                      onChange={() => setAddressForm(prev => ({ ...prev, type: "office" }))}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    Văn phòng (Giao nhận giờ hành chính)
                  </label>
                </div>
              </div>

              {/* Binary Switches */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
                <label className="flex items-start gap-2.5 cursor-pointer text-stone-600 dark:text-stone-450 leading-normal select-none">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold block text-stone-800 dark:text-stone-250">Đặt làm địa chỉ mặc định</span>
                    <span className="text-[10px] text-stone-400">Sử dụng làm địa chỉ giao nhận mặc định khi mua hàng trên sàn.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-not-allowed opacity-80 text-stone-600 dark:text-stone-450 leading-normal select-none">
                  <input
                    type="checkbox"
                    checked={addressForm.isPickup}
                    disabled
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-stone-800 dark:text-stone-250">Đặt làm địa chỉ lấy hàng</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-medium">Bắt buộc tích chọn làm địa chỉ lấy hàng khi đăng ký thiết lập Shop mới.</span>
                  </div>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-850 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl cursor-pointer transition-all"
                >
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
