import React, { useState, useRef, useEffect } from "react";
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
  X,
  FileImage,
  Building2,
  Globe
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { HttpClient } from "../../services/httpClient";
import { AuthService } from "../../services/authService";
import AdministrativeService, { AdministrativeProvinceDTO, AdministrativeCommuneDTO } from "../../services/administrativeService";

export const StoreProfileSetupView: React.FC = () => {
  const {
    currentUser,
    stores,
    registerSeller,
    sendSellerOtp,
    verifySellerOtp,
    addAddress
  } = useAppContext();

  const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);

  // Wizard scroll reference
  const wizardRef = useRef<HTMLDivElement>(null);

  // Wizard step state
  const [step, setStep] = useState(1);

  const changeStep = (nextStep: number) => {
    setStep(nextStep);
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // ── Step 1: Basic Info & OTP ──────────────────────────────────────────────
  const [storeName, setStoreName] = useState("");
  const [shopEmail, setShopEmail] = useState(currentUser?.email || "");
  const [verifiedShopEmail, setVerifiedShopEmail] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, resendCooldown]);

  // Vietnamese phone validation
  const normPhone = shopPhone.replace(/\D/g, "");
  const isPhoneValid = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(shopPhone) || normPhone.length >= 10;

  // ── Step 2: Pickup Address ────────────────────────────────────────────────
  const [pickupAddress, setPickupAddress] = useState<any | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [provincesList, setProvincesList] = useState<AdministrativeProvinceDTO[]>([]);
  const [communesList, setCommunesList] = useState<AdministrativeCommuneDTO[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [addressApiError, setAddressApiError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    fullname: currentUser?.name || "",
    phone: shopPhone,
    provinceId: 0,
    province: "",
    ward: "",
    communeCode: "",
    detailAddress: "",
    isDefault: true,
    isPickup: true,
    type: "home" as "home" | "office"
  });

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setAddressApiError(null);
      try {
        const data = await AdministrativeService.getProvinces();
        if (isMounted) setProvincesList(data);
      } catch (err) {
        if (isMounted) setAddressApiError("Không thể tải dữ liệu tỉnh/thành và xã/phường. Vui lòng thử lại.");
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => { isMounted = false; };
  }, []);

  const handleProvinceSelectChange = async (provIdStr: string) => {
    const pId = Number(provIdStr);
    const selectedProv = provincesList.find(p => p.id === pId);
    setAddressForm(prev => ({
      ...prev,
      provinceId: pId,
      province: selectedProv ? selectedProv.name : "",
      ward: "",
      communeCode: ""
    }));
    setCommunesList([]);
    if (pId) {
      setLoadingCommunes(true);
      try {
        const communes = await AdministrativeService.getCommunesByProvince(pId);
        setCommunesList(communes);
      } catch (err) {
        setAddressApiError("Không thể tải dữ liệu tỉnh/thành và xã/phường. Vui lòng thử lại.");
      } finally {
        setLoadingCommunes(false);
      }
    }
  };

  const handleCommuneSelectChange = (commCode: string) => {
    const selectedComm = communesList.find(c => c.code === commCode);
    setAddressForm(prev => ({
      ...prev,
      communeCode: commCode,
      ward: selectedComm ? selectedComm.displayName : ""
    }));
  };

  // ── Step 3: Carriers, Business Evidence & KYC ─────────────────────────────
  const [shippingSettings, setShippingSettings] = useState({
    greenExpress: true,
    hoaToc: false,
    spx: false,
    ghtk: false
  });

  // CCCD KYC
  const [kycFrontImage, setKycFrontImage] = useState("");
  const [kycBackImage, setKycBackImage] = useState("");
  const [kycFrontPreview, setKycFrontPreview] = useState("");
  const [kycBackPreview, setKycBackPreview] = useState("");

  // Business Operation Type
  const [businessType, setBusinessType] = useState<"PHYSICAL_STORE" | "ONLINE_GARDEN_OR_WAREHOUSE">("PHYSICAL_STORE");

  // Business Evidence Images
  const [businessEvidencePreviews, setBusinessEvidencePreviews] = useState<string[]>([]);
  const [businessEvidenceImages, setBusinessEvidenceImages] = useState<string[]>([]);

  // Logo
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (kycFrontPreview) URL.revokeObjectURL(kycFrontPreview);
      if (kycBackPreview) URL.revokeObjectURL(kycBackPreview);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      businessEvidencePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // ── OTP Handlers ──────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const normEmail = shopEmail.trim().toLowerCase();
    if (!normEmail) {
      setOtpError("Vui lòng nhập email.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await sendSellerOtp(normEmail);
      if (res.success) {
        setOtpSent(true);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setOtpError("Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const normEmail = shopEmail.trim().toLowerCase();
    if (!otpCode) {
      setOtpError("Vui lòng nhập mã OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await verifySellerOtp(normEmail, otpCode);
      if (res.success) {
        setOtpVerified(true);
        setVerifiedShopEmail(normEmail);
      }
    } catch (err: any) {
      setOtpError(err.message || "Mã OTP không chính xác.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Address Saver ─────────────────────────────────────────────────────────
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePhone = shopPhone.trim() || addressForm.phone;
    if (!addressForm.fullname || !effectivePhone || !addressForm.detailAddress || !addressForm.communeCode || !addressForm.ward) {
      toast.error("Vui lòng chọn Xã / Phường / Đặc khu và điền đầy đủ các thông tin địa chỉ.");
      return;
    }
    try {
      const result = await addAddress({
        fullname: addressForm.fullname,
        phone: effectivePhone,
        province: addressForm.province,
        provinceCode: addressForm.provinceCode,
        district: "", // 2-level administrative format
        ward: addressForm.ward,
        communeCode: addressForm.communeCode,
        communeName: addressForm.ward,
        detailAddress: addressForm.detailAddress,
        isDefault: addressForm.isDefault,
        isPickup: addressForm.isPickup,
        type: addressForm.type
      });
      if (result.success) {
        setPickupAddress(result.address);
        setShowAddressModal(false);
      }
    } catch (err: any) {
      const rawMsg = err?.message || "";
      const safeMsg = (rawMsg && !/sql|jdbc|column|hibernate|table|insert|select|update|delete/i.test(rawMsg))
        ? rawMsg
        : "Không thể lưu địa chỉ. Vui lòng thử lại sau.";
      toast.error(safeMsg);
    }
  };

  // ── File Upload Handlers (KYC & Evidence) ──────────────────────────────────
  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Vui lòng tải lên định dạng ảnh hợp lệ (PNG, JPG).");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB.");
      return false;
    }
    return true;
  };

  const handleKycFileChange = async (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;

    const previewUrl = URL.createObjectURL(file);
    if (side === "front") {
      if (kycFrontPreview) URL.revokeObjectURL(kycFrontPreview);
      setKycFrontPreview(previewUrl);
    } else {
      if (kycBackPreview) URL.revokeObjectURL(kycBackPreview);
      setKycBackPreview(previewUrl);
    }

    try {
      const storageUrl = await AuthService.uploadKycDocument(file);
      if (side === "front") setKycFrontImage(storageUrl);
      else setKycBackImage(storageUrl);
    } catch (err: any) {
      toast.error(`Tải lên ảnh ${side === "front" ? "mặt trước" : "mặt sau"} CCCD thất bại. Vui lòng thử lại.`);
    }
  };

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (businessEvidencePreviews.length + files.length > 5) {
      toast.error("Tối đa chỉ tải lên 5 ảnh minh chứng hoạt động.");
      return;
    }

    for (const file of files) {
      if (validateFile(file)) {
        const previewUrl = URL.createObjectURL(file);
        setBusinessEvidencePreviews(prev => [...prev, previewUrl]);

        try {
          const storageUrl = await AuthService.uploadKycDocument(file);
          setBusinessEvidenceImages(prev => [...prev, storageUrl]);
        } catch (err: any) {
          toast.error("Tải lên ảnh minh chứng thất bại. Vui lòng thử lại.");
        }
      }
    }
  };

  const handleRemoveEvidence = (index: number) => {
    const targetPreview = businessEvidencePreviews[index];
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setBusinessEvidencePreviews(prev => prev.filter((_, idx) => idx !== index));
    setBusinessEvidenceImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;

    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await HttpClient.post<any>("/api/store/profile/logo/upload", formData);
      setLogoUrl(response.url);
      toast.success("Tải logo cửa hàng lên thành công!");
    } catch (err: any) {
      toast.error("Không thể tải logo lên: " + (err.message || err));
      setLogoPreview("");
      setLogoUrl("");
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Submit Seller Registration ───────────────────────────────────────────
  const handleCompleteRegistration = async () => {
    if (!currentUser || !pickupAddress) return;
    setSubmitting(true);
    try {
      await registerSeller({
        name: storeName,
        phone: shopPhone,
        city: pickupAddress.province,
        district: pickupAddress.district || "",
        address: `${pickupAddress.detail_address}, ${pickupAddress.ward}`,
        description: "Nhà vườn sinh thái GreenLife",
        logoUrl: logoUrl,
        verificationDocument: kycFrontImage || kycFrontPreview,
        shopEmail: shopEmail.trim().toLowerCase(),
        pickupAddressId: pickupAddress.address_id,
        businessType: businessType,
        cccdFrontUrl: kycFrontImage || kycFrontPreview,
        cccdBackUrl: kycBackImage || kycBackPreview,
        businessEvidenceUrls: businessEvidenceImages.length > 0 ? businessEvidenceImages : businessEvidencePreviews
      });
      toast.success("Đăng ký bán hàng thành công! Hồ sơ đang chờ phê duyệt.");
    } catch (err: any) {
      // PRESERVE FORM DATA: Remain on Step 4 and do NOT reset state on failure
      const rawMsg = err?.message || "";
      const safeMsg = (rawMsg && !/sql|jdbc|column|hibernate|table|insert|select|update|delete/i.test(rawMsg))
        ? rawMsg
        : "Không thể xử lý tài liệu xác minh. Vui lòng tải lại ảnh và thử lại.";
      toast.error("Đăng ký bán hàng thất bại: " + safeMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step Validation Helpers
  const normEmail = shopEmail.trim().toLowerCase();
  const canGoToStep2 =
    storeName.trim().length > 0 &&
    isPhoneValid &&
    otpVerified &&
    normEmail === verifiedShopEmail;

  const canGoToStep3 = pickupAddress !== null;

  const hasCarriersSelected =
    shippingSettings.greenExpress ||
    shippingSettings.hoaToc ||
    shippingSettings.spx ||
    shippingSettings.ghtk;

  const hasKycImages = Boolean((kycFrontImage || kycFrontPreview) && (kycBackImage || kycBackPreview));
  const hasBusinessEvidence = (businessEvidenceImages.length > 0 || businessEvidencePreviews.length > 0);

  const canGoToStep4 = hasCarriersSelected && hasKycImages && hasBusinessEvidence;
  const canSubmit = canGoToStep4 && !submitting;

  // ── Render Pending / Verified States ──────────────────────────────────────
  if (myStore && !myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-[var(--gl-text-primary)]">
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-8 sm:p-10 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500 animate-pulse" />
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--gl-text-primary)]">Cửa hàng của bạn đang chờ Admin duyệt</h2>
            <p className="text-xs text-[var(--gl-text-muted)] max-w-md mx-auto leading-relaxed">
              Hệ thống đang kiểm tra hồ sơ đăng ký bán hàng của bạn. Chúng tôi sẽ duyệt thông tin KYC và địa chỉ lấy hàng trong vòng 12-24 giờ làm việc.
            </p>
          </div>
          <div className="bg-[var(--gl-bg-muted)] p-5 rounded-2xl border border-[var(--gl-border)] text-left space-y-3 text-xs">
            <h4 className="font-semibold text-[var(--gl-text-primary)] border-b border-[var(--gl-border)] pb-2">Thông tin đăng ký của bạn:</h4>
            <div>
              <span className="text-[var(--gl-text-muted)] font-mono block text-[10px]">Tên cửa hàng:</span>
              <span className="font-bold text-[var(--gl-text-primary)]">{myStore.name}</span>
            </div>
            <div>
              <span className="text-[var(--gl-text-muted)] font-mono block text-[10px]">Địa chỉ đăng ký:</span>
              <span className="text-[var(--gl-text-secondary)]">{myStore.address}</span>
            </div>
            <div>
              <span className="text-[var(--gl-text-muted)] font-mono block text-[10px]">Trạng thái kiểm duyệt:</span>
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold font-mono">
                🟡 ĐANG CHỜ DUYỆT (PENDING)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myStore && myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--gl-text-primary)]">Cửa hàng của bạn đã hoạt động</h2>
          <p className="text-xs text-[var(--gl-text-muted)]">Đối tác GreenLife đã được phê duyệt thành công. Vui lòng chuyển đổi vai trò sang Seller tại menu cá nhân để bắt đầu kinh doanh.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wizardRef} className="max-w-3xl mx-auto py-8 px-4 text-[var(--gl-text-primary)]">
      {/* Stepper Progress Bar */}
      <div className="mb-8 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { id: 1, label: "Thông tin cơ bản" },
            { id: 2, label: "Địa chỉ lấy hàng" },
            { id: 3, label: "Vận chuyển & KYC" },
            { id: 4, label: "Xác nhận & Hoàn tất" }
          ].map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${step > idx ? "bg-emerald-500" : "bg-[var(--gl-border)]"}`} />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === s.id
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20"
                    : step > s.id
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)]"
                  }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap hidden sm:inline-block ${step === s.id ? "text-[var(--gl-text-primary)] font-semibold" : "text-[var(--gl-text-muted)]"
                  }`}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 sm:p-8 rounded-3xl shadow-lg space-y-6 relative">
        {/* Wizard Header */}
        <div className="border-b border-[var(--gl-border)] pb-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider uppercase font-bold">
            Đăng ký bán hàng • Bước {step} / 4
          </span>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--gl-text-primary)] mt-1">
            {step === 1 && "Thông Tin Shop"}
            {step === 2 && "Địa Chỉ Lấy Hàng"}
            {step === 3 && "Cấu Hình Vận Chuyển & Định Danh"}
            {step === 4 && "Kiểm Tra Lại Hồ Sơ"}
          </h1>
        </div>

        {/* ── STEP 1: Basic Info ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5 font-semibold">
                <Store className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                Tên cửa hàng / Thương hiệu xanh:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nhà Vườn Xanh Organic Lâm Đồng"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2 px-3"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5 font-semibold">
                <Mail className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                Email đối tác (Nhận đơn hàng & xác thực OTP):
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="partner@gmail.com"
                  value={shopEmail}
                  onChange={(e) => {
                    setShopEmail(e.target.value);
                    if (e.target.value.trim().toLowerCase() !== verifiedShopEmail) {
                      setOtpVerified(false);
                    }
                  }}
                  disabled={otpVerified && shopEmail.trim().toLowerCase() === verifiedShopEmail}
                  className="flex-1 bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2 px-3 disabled:opacity-60"
                />
                {(!otpVerified || shopEmail.trim().toLowerCase() !== verifiedShopEmail) && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || !shopEmail || resendCooldown > 0}
                    className="px-4 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer transition-all"
                  >
                    {otpLoading ? "Đang gửi..." : resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : otpSent ? "Gửi lại" : "Gửi mã OTP"}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (!otpVerified || shopEmail.trim().toLowerCase() !== verifiedShopEmail) && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Mã OTP 6 số đã được gửi đến {shopEmail}. Vui lòng nhập mã bên dưới:
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6 số OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-36 text-center bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:outline-none rounded-xl py-2 px-3 tracking-widest font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpCode.length < 6}
                    className="px-4 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Xác thực
                  </button>
                </div>
              </div>
            )}

            {otpVerified && shopEmail.trim().toLowerCase() === verifiedShopEmail && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-semibold text-[10px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Đã xác thực email đối tác {verifiedShopEmail} thành công!
              </div>
            )}

            {otpError && <div className="text-[10px] text-rose-500 font-semibold">⚠️ {otpError}</div>}

            {/* Single Phone Input */}
            <div className="space-y-1.5">
              <label className="text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5 font-semibold">
                <Phone className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                Số điện thoại Shop:
              </label>
              <input
                type="tel"
                placeholder="0905123456"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:outline-none rounded-xl py-2 px-3"
              />
            </div>

            {/* Logo */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5 font-semibold">
                <Store className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                Logo Cửa hàng (Tùy chọn):
              </label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[var(--gl-border)] bg-[var(--gl-bg-page)] flex items-center justify-center">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border border-dashed border-[var(--gl-border)] flex items-center justify-center text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)]">
                    <Store className="w-6 h-6 text-[var(--gl-text-muted)]" />
                  </div>
                )}
                <label className="cursor-pointer min-h-[40px] bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-border)] border border-[var(--gl-border)] px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 text-[var(--gl-text-secondary)]">
                  <Upload className="w-3.5 h-3.5" />
                  {logoUploading ? "Đang tải..." : logoUrl ? "Thay đổi logo" : "Tải logo lên"}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={logoUploading} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Pickup Address ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            {pickupAddress ? (
              <div className="p-4 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-2xl space-y-3 relative">
                <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                  Địa chỉ lấy hàng
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-[var(--gl-text-primary)] text-sm">{pickupAddress.fullname}</div>
                  <div className="text-[var(--gl-text-muted)]">SĐT: {pickupAddress.phone}</div>
                </div>
                <div className="text-[var(--gl-text-secondary)] font-medium break-words">
                  {pickupAddress.detail_address}, {pickupAddress.ward}, {pickupAddress.province}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="mt-2 text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  Thay đổi địa chỉ lấy hàng
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[var(--gl-border)] p-8 rounded-2xl text-center space-y-3 bg-[var(--gl-bg-muted)]">
                <MapPin className="w-8 h-8 text-[var(--gl-text-muted)] mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[var(--gl-text-primary)]">Chưa thiết lập địa chỉ lấy hàng</h4>
                  <p className="text-[var(--gl-text-muted)] text-[10px] max-w-sm mx-auto">
                    Địa chỉ này dùng cho đơn vị vận chuyển xe điện GreenLife đến lấy sản phẩm đóng gói.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm địa chỉ lấy hàng 2 cấp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Carriers, Business Evidence & KYC ───────────────────── */}
        {step === 3 && (
          <div className="space-y-6 text-xs">
            {/* Carriers */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-[var(--gl-text-muted)] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500" /> CÀI ĐẶT VẬN CHUYỂN
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "greenExpress", name: "Green Express", desc: "Vận chuyển xe máy/ô tô điện thân thiện môi trường", highlight: true },
                  { id: "hoaToc", name: "Hỏa Tốc Green", desc: "Giao siêu tốc 2h bằng phương tiện sạch", highlight: false },
                  { id: "spx", name: "SPX Express", desc: "Đối tác giao nhận liên kết tiêu chuẩn", highlight: false },
                  { id: "ghtk", name: "GHTK", desc: "Đơn vị vận chuyển nhanh toàn quốc", highlight: false }
                ].map((carrier) => (
                  <div
                    key={carrier.id}
                    onClick={() => setShippingSettings(prev => ({ ...prev, [carrier.id]: !prev[carrier.id as keyof typeof prev] }))}
                    className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex items-start justify-between select-none ${shippingSettings[carrier.id as keyof typeof shippingSettings]
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--gl-border)] bg-[var(--gl-bg-muted)]"
                      }`}
                  >
                    <div className="space-y-1 pr-4">
                      <div className="font-bold flex items-center gap-1.5 text-[var(--gl-text-primary)]">
                        {carrier.name}
                        {carrier.highlight && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">Khuyên dùng</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--gl-text-muted)]">{carrier.desc}</p>
                    </div>
                    <div className={`w-8 h-5 rounded-full flex items-center p-0.5 ${shippingSettings[carrier.id as keyof typeof shippingSettings] ? "bg-emerald-600" : "bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)]"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${shippingSettings[carrier.id as keyof typeof shippingSettings] ? "translate-x-3" : "translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory CCCD Security Instruction Box */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
              <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> HƯỚNG DẪN BẢO MẬT VÀ TẢI ẢNH CCCD (KYC)
              </h4>
              <ul className="text-[10px] text-[var(--gl-text-secondary)] space-y-1 list-disc list-inside">
                <li>Sử dụng Căn cước công dân (CCCD) chính chủ của đại diện thương hiệu/chủ cửa hàng.</li>
                <li>Tải lên đầy đủ cả 2 mặt (Mặt trước & Mặt sau).</li>
                <li>Ảnh chụp cần rõ nét, đủ ánh sáng, không bị mờ, lóa hoặc mất 4 góc.</li>
                <li>Hình ảnh tài liệu được bảo mật strictly và chỉ phục vụ Ban quản lý đối chiếu phê duyệt.</li>
              </ul>
            </div>

            {/* CCCD Image Upload Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front Side */}
              <div className="space-y-1.5">
                <span className="font-semibold text-[var(--gl-text-secondary)]">Ảnh CCCD Mặt Trước (Bắt buộc):</span>
                {kycFrontPreview ? (
                  <div className="relative border border-[var(--gl-border)] rounded-2xl overflow-hidden bg-[var(--gl-bg-page)] h-40 flex items-center justify-center group">
                    <img src={kycFrontPreview} alt="Mặt trước CCCD" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(kycFrontPreview);
                        setKycFrontPreview("");
                        setKycFrontImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer opacity-90"
                      aria-label="Xóa ảnh mặt trước"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[var(--gl-border)] hover:border-emerald-500/80 rounded-2xl cursor-pointer flex flex-col items-center justify-center h-40 bg-[var(--gl-bg-muted)] gap-1.5 p-4">
                    <Upload className="w-6 h-6 text-[var(--gl-text-muted)]" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Tải ảnh mặt trước</span>
                    <span className="text-[10px] text-[var(--gl-text-muted)]">PNG, JPG, WEBP (tối đa 5MB)</span>
                    <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, "front")} className="hidden" />
                  </label>
                )}
              </div>

              {/* Back Side */}
              <div className="space-y-1.5">
                <span className="font-semibold text-[var(--gl-text-secondary)]">Ảnh CCCD Mặt Sau (Bắt buộc):</span>
                {kycBackPreview ? (
                  <div className="relative border border-[var(--gl-border)] rounded-2xl overflow-hidden bg-[var(--gl-bg-page)] h-40 flex items-center justify-center group">
                    <img src={kycBackPreview} alt="Mặt sau CCCD" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(kycBackPreview);
                        setKycBackPreview("");
                        setKycBackImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer opacity-90"
                      aria-label="Xóa ảnh mặt sau"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[var(--gl-border)] hover:border-emerald-500/80 rounded-2xl cursor-pointer flex flex-col items-center justify-center h-40 bg-[var(--gl-bg-muted)] gap-1.5 p-4">
                    <Upload className="w-6 h-6 text-[var(--gl-text-muted)]" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Tải ảnh mặt sau</span>
                    <span className="text-[10px] text-[var(--gl-text-muted)]">PNG, JPG, WEBP (tối đa 5MB)</span>
                    <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, "back")} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Business Operation Type Selection */}
            <div className="space-y-3 pt-3 border-t border-[var(--gl-border)]">
              <h3 className="text-xs font-mono font-bold text-[var(--gl-text-muted)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" /> HÌNH THỨC HOẠT ĐỘNG KINH DOANH
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setBusinessType("PHYSICAL_STORE")}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 select-none ${businessType === "PHYSICAL_STORE"
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "border-[var(--gl-border)] bg-[var(--gl-bg-muted)]"
                    }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[var(--gl-text-primary)]">Có cửa hàng trực tiếp</div>
                    <p className="text-[10px] text-[var(--gl-text-muted)]">Cửa hàng mặt phố, vườn ươm mở đón khách hoặc điểm bán cố định.</p>
                  </div>
                </div>

                <div
                  onClick={() => setBusinessType("ONLINE_GARDEN_OR_WAREHOUSE")}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 select-none ${businessType === "ONLINE_GARDEN_OR_WAREHOUSE"
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "border-[var(--gl-border)] bg-[var(--gl-bg-muted)]"
                    }`}
                >
                  <Globe className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-[var(--gl-text-primary)]">Kinh doanh online / Nhà vườn đóng gói</div>
                    <p className="text-[10px] text-[var(--gl-text-muted)]">Khu vực ươm trồng, kho bãi hoặc khu vực xử lý đơn đóng hàng.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Evidence Upload Section */}
            <div className="space-y-3 pt-3 border-t border-[var(--gl-border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-[var(--gl-text-muted)] flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-emerald-500" /> MINH CHỨNG HOẠT ĐỘNG KINH DOANH ({businessEvidencePreviews.length}/5)
                </h3>
                <span className="text-[10px] text-[var(--gl-text-muted)]">Yêu cầu tối thiểu 1 ảnh</span>
              </div>
              <p className="text-[10px] text-[var(--gl-text-muted)]">
                {businessType === "PHYSICAL_STORE"
                  ? "Tải lên ảnh biển hiệu cửa hàng, khu vực trưng bày cây cảnh hoặc mặt tiền cơ sở kinh doanh."
                  : "Tải lên ảnh khu vực nhà vườn, vườn ươm cây, kho chứa vật tư hoặc khu vực đóng gói sản phẩm."}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {businessEvidencePreviews.map((prevUrl, idx) => (
                  <div key={idx} className="relative border border-[var(--gl-border)] rounded-2xl overflow-hidden bg-[var(--gl-bg-page)] h-28 flex items-center justify-center group">
                    <img src={prevUrl} alt={`Minh chứng ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-all cursor-pointer opacity-90"
                      aria-label="Xóa minh chứng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {businessEvidencePreviews.length < 5 && (
                  <label className="border-2 border-dashed border-[var(--gl-border)] hover:border-emerald-500/80 rounded-2xl cursor-pointer flex flex-col items-center justify-center h-28 bg-[var(--gl-bg-muted)] gap-1 p-2 text-center">
                    <Upload className="w-5 h-5 text-[var(--gl-text-muted)]" />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Thêm minh chứng</span>
                    <input type="file" accept="image/*" multiple onChange={handleEvidenceFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review Submit ───────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5 text-xs text-[var(--gl-text-secondary)]">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1 text-[var(--gl-text-primary)] font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-[9px] font-bold block">Lưu ý bảo mật & Phê duyệt</span>
              Hồ sơ đăng ký sẽ được Ban quản lý GreenLife đối chiếu kiểm tra thực tế trong vòng 12-24 giờ làm việc.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)]">
                <h4 className="font-bold border-b border-[var(--gl-border)] pb-2 text-[var(--gl-text-primary)] flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-500" /> Thông tin Shop cơ bản
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-[var(--gl-text-muted)] block text-[9px]">TÊN CỬA HÀNG</span>
                    <strong className="text-[var(--gl-text-primary)]">{storeName}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--gl-text-muted)] block text-[9px]">EMAIL ĐỐI TÁC (ĐÃ XÁC THỰC)</span>
                    <strong>{shopEmail}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--gl-text-muted)] block text-[9px]">SỐ ĐIỆN THOẠI</span>
                    <strong>{shopPhone}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)]">
                <h4 className="font-bold border-b border-[var(--gl-border)] pb-2 text-[var(--gl-text-primary)] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" /> Địa chỉ lấy hàng 2 cấp
                </h4>
                {pickupAddress && (
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-[var(--gl-text-muted)] block text-[9px]">NGƯỜI GỬI HÀNG</span>
                      <strong>{pickupAddress.fullname} (SĐT: {pickupAddress.phone})</strong>
                    </div>
                    <div>
                      <span className="text-[var(--gl-text-muted)] block text-[9px]">ĐỊA CHỈ CHI TIẾT</span>
                      <strong className="break-words">{pickupAddress.detail_address}, {pickupAddress.ward}, {pickupAddress.province}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] space-y-3">
              <h4 className="font-bold border-b border-[var(--gl-border)] pb-2 text-[var(--gl-text-primary)] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500" /> Đơn vị vận chuyển kích hoạt
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(shippingSettings).map(([key, active]) => (
                  <span
                    key={key}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border ${active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-muted)] border border-[var(--gl-border)] line-through"
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

            {/* KYC & Evidence Summary Review */}
            <div className="bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] space-y-3">
              <h4 className="font-bold border-b border-[var(--gl-border)] pb-2 text-[var(--gl-text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Hồ sơ Định danh KYC & Minh chứng
              </h4>
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-[var(--gl-text-muted)] block text-[9px]">HÌNH THỨC HOẠT ĐỘNG</span>
                  <strong>{businessType === "PHYSICAL_STORE" ? "Có cửa hàng trực tiếp" : "Kinh doanh online / nhà vườn, kho đóng gói"}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-[var(--gl-border)] rounded-xl overflow-hidden h-24 flex items-center justify-center bg-[var(--gl-bg-page)]">
                    <img src={kycFrontPreview} alt="Front CCCD preview" className="max-h-full object-contain" />
                  </div>
                  <div className="border border-[var(--gl-border)] rounded-xl overflow-hidden h-24 flex items-center justify-center bg-[var(--gl-bg-page)]">
                    <img src={kycBackPreview} alt="Back CCCD preview" className="max-h-full object-contain" />
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-[var(--gl-text-muted)] block text-[9px] mb-1.5">ẢNH MINH CHỨNG HOẠT ĐỘNG ({businessEvidencePreviews.length} ảnh)</span>
                  <div className="flex flex-wrap gap-2">
                    {businessEvidencePreviews.map((url, idx) => (
                      <div key={idx} className="w-16 h-16 border border-[var(--gl-border)] rounded-lg overflow-hidden bg-[var(--gl-bg-page)] flex items-center justify-center">
                        <img src={url} alt={`Evidence preview ${idx + 1}`} className="max-h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--gl-border)]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => changeStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-border)] text-[var(--gl-text-secondary)] font-bold rounded-xl cursor-pointer text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => changeStep(step + 1)}
              disabled={(step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3) || (step === 3 && !canGoToStep4)}
              className="flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl cursor-pointer text-xs transition-all"
            >
              Tiếp theo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-6 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold uppercase rounded-xl cursor-pointer shadow-md tracking-wider text-xs transition-all"
            >
              {submitting ? "Đang xử lý hồ sơ..." : "Gửi Hồ Sơ Đăng Ký"}
            </button>
          )}
        </div>
      </div>

      {/* POPUP MODAL: Add 2-Level Pickup Address */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[calc(100dvh-32px)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
            <div className="flex items-center justify-between p-5 border-b border-[var(--gl-border)] flex-shrink-0">
              <h3 className="text-sm font-bold text-[var(--gl-text-primary)] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" /> Thêm Địa Chỉ Lấy Hàng Mới (2 Cấp Hành Chính)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] p-1 rounded-full cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[var(--gl-text-secondary)] font-mono font-semibold">Họ và tên người nhận:</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên người đưa hàng"
                    value={addressForm.fullname}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, fullname: e.target.value }))}
                    className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] rounded-xl py-2 px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[var(--gl-text-secondary)] font-mono font-semibold">Số điện thoại liên hệ (Tự động từ SĐT Shop):</label>
                  <input
                    type="tel"
                    readOnly
                    disabled
                    value={shopPhone || addressForm.phone}
                    className="w-full bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] border border-[var(--gl-border)] rounded-xl py-2 px-3 font-semibold cursor-not-allowed opacity-90"
                  />
                </div>
              </div>

              {addressApiError && (
                <div className="text-[10px] text-rose-500 font-semibold p-2.5 bg-rose-500/10 rounded-xl">
                  {addressApiError}
                </div>
              )}

              {/* 2-Level Cascade Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[var(--gl-text-secondary)] font-mono font-semibold">Tỉnh / Thành phố:</label>
                  <select
                    value={addressForm.provinceId || ""}
                    onChange={(e) => handleProvinceSelectChange(e.target.value)}
                    disabled={loadingProvinces}
                    className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] rounded-xl py-2 px-3 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)]">
                      {loadingProvinces ? "Đang tải dữ liệu địa chỉ..." : "-- Chọn Tỉnh / Thành phố --"}
                    </option>
                    {provincesList.map((prov) => (
                      <option key={prov.id} value={prov.id} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{prov.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[var(--gl-text-secondary)] font-mono font-semibold">Xã / Phường / Đặc khu:</label>
                  <select
                    value={addressForm.communeCode}
                    onChange={(e) => handleCommuneSelectChange(e.target.value)}
                    disabled={!addressForm.provinceId || loadingCommunes}
                    className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] rounded-xl py-2 px-3 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)]">
                      {!addressForm.provinceId
                        ? "-- Vui lòng chọn Tỉnh / Thành phố trước --"
                        : loadingCommunes
                          ? "Đang tải dữ liệu địa chỉ..."
                          : communesList.length === 0
                            ? "Dữ liệu xã/phường của tỉnh/thành này chưa có."
                            : "-- Chọn Xã / Phường / Đặc khu --"}
                    </option>
                    {communesList.map((comm) => (
                      <option key={comm.code} value={comm.code} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{comm.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--gl-text-secondary)] font-mono font-semibold">Số nhà, tên đường, thôn, tổ dân phố:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 120 Hoàng Diệu, Kiệt 3 H4"
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, detailAddress: e.target.value }))}
                  className="w-full bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] rounded-xl py-2 px-3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--gl-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 min-h-[40px] bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
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
