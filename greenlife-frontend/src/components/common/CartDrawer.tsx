import React, { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  PlusCircle, 
  Check,
  AlertCircle
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useCart } from "../../hooks/useCart";
import { AddressService } from "../../services/addressService";
import { OrderService } from "../../services/orderService";
import { UserAddress } from "../../types";
import { toast } from "react-hot-toast";
import { EmptyState } from "./EmptyState";
import { getMediaUrl } from "../../utils/mediaUrl";
import AdministrativeService, { AdministrativeProvinceDTO, AdministrativeCommuneDTO } from "../../services/administrativeService";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentPage: (page: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  setCurrentPage,
}) => {
  const { currentUser, checkoutCart } = useAppContext();
  const { items: cart, cartTotal, cartItemCount, co2OffsetKg, updateCartQuantity, removeFromCart, clearCart } = useCart();

  // Checkout flow state (1: Cart items, 2: Shipping Address, 3: Payment/Note)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formError, setFormError] = useState("");

  // Address selection state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // New address form state
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  const [provincesList, setProvincesList] = useState<AdministrativeProvinceDTO[]>([]);
  const [communesList, setCommunesList] = useState<AdministrativeCommuneDTO[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const [addressForm, setAddressForm] = useState({
    fullname: currentUser?.name || "",
    phone: "",
    provinceId: 0,
    province: "",
    ward: "",
    communeCode: "",
    detailAddress: "",
    isDefault: false
  });

  // Step 3 state
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PAYOS">("COD");
  const [note, setNote] = useState("");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  // Reset form error when toggle form view
  useEffect(() => {
    setFormError("");
  }, [showAddAddressForm]);

  // ESC closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  // Fetch addresses when step 2 opens
  useEffect(() => {
    if (step === 2 && currentUser) {
      loadAddresses();
    }
  }, [step, currentUser]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    setErrorMsg("");
    try {
      const list = await AddressService.getAddresses();
      setAddresses(list);
      
      // Auto-select default or first address
      if (list.length > 0) {
        const defaultAddr = list.find(a => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.address_id || null);
        } else {
          setSelectedAddressId(list[0].address_id || null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tải danh sách địa chỉ.");
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await AdministrativeService.getProvinces();
        if (isMounted) setProvincesList(data);
      } catch (err) {
        // Handled silently
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
        // Handled silently
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

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressForm.fullname.trim()) {
      setFormError("Vui lòng nhập tên người nhận.");
      return;
    }

    if (!addressForm.communeCode || !addressForm.ward) {
      setFormError("Vui lòng chọn Xã / Phường / Đặc khu.");
      return;
    }
    
    const phoneTrimmed = addressForm.phone.trim();
    if (!phoneTrimmed) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (phoneTrimmed.length < 10 || !/^0[0-9]{9,10}$/.test(phoneTrimmed)) {
      setFormError("Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10-11 số).");
      return;
    }
    
    if (!addressForm.detailAddress.trim()) {
      setFormError("Vui lòng nhập địa chỉ chi tiết.");
      return;
    }

    setFormError("");

    try {
      const payload: Partial<UserAddress> = {
        fullname: addressForm.fullname,
        phone: addressForm.phone,
        province: addressForm.province,
        communeCode: addressForm.communeCode,
        communeName: addressForm.ward,
        ward: addressForm.ward,
        detail_address: addressForm.detailAddress,
        is_default: addressForm.isDefault
      };
      
      const created = await AddressService.createAddress(payload);
      setAddresses(prev => [...prev, created]);
      setSelectedAddressId(created.address_id || null);
      setShowAddAddressForm(false);
      
      // Reset form
      setAddressForm({
        fullname: currentUser?.name || "",
        phone: "",
        provinceId: 0,
        province: "",
        ward: "",
        communeCode: "",
        detailAddress: "",
        isDefault: false
      });
    } catch (err: any) {
      setFormError("Lỗi khi tạo địa chỉ mới: " + err.message);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập trước khi thanh toán.");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Vui lòng chọn hoặc tạo địa chỉ giao hàng.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const selected = addresses.find(a => a.address_id === selectedAddressId);
      const checkoutPayload = {
        addressId: selectedAddressId,
        recipientName: selected?.fullname || currentUser.name,
        recipientPhone: selected?.phone || "",
        shippingAddress: selected ? `${selected.detail_address}, ${selected.ward}, ${selected.district}, ${selected.province}` : "",
        note: note,
        paymentMethod: paymentMethod
      };

      const orders = await checkoutCart(checkoutPayload);
      
      // PayOS redirect logic
      if (paymentMethod === "PAYOS" && orders.length > 0) {
        const payosOrder = orders[0];
        try {
          const data = await OrderService.createPayOSPaymentLink(payosOrder.id);
          if (data && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
            return;
          }
        } catch (payosErr: any) {
          toast.error("Không thể tạo liên kết thanh toán PayOS: " + (payosErr.message || payosErr));
        }
      }

      setCheckoutComplete(true);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || "Gặp sự cố khi thực hiện thanh toán.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedAddressDetails = () => {
    const selected = addresses.find(a => a.address_id === selectedAddressId);
    if (!selected) return "";
    return `${selected.fullname} (${selected.phone}) - ${selected.detail_address}, ${selected.ward}, ${selected.district}, ${selected.province}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <style>{`
        .checkout-input:-webkit-autofill,
        .checkout-input:-webkit-autofill:hover, 
        .checkout-input:-webkit-autofill:focus, 
        .checkout-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px var(--stone-950) inset !important;
          -webkit-text-fill-color: var(--stone-100) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden">
        
        {/* Backdrop cover */}
        <div 
          onClick={handleClose}
          className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity opacity-100 duration-200 ${submitting ? "cursor-not-allowed" : "cursor-pointer"}`}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col bg-[var(--gl-bg-surface)] border-l border-[var(--gl-border)] shadow-2xl text-[var(--gl-text-primary)]">
              
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-5 py-5 bg-[var(--gl-bg-surface)]">
                <h2 className="text-sm font-semibold text-[var(--gl-text-primary)] flex items-center gap-2" id="slide-over-title">
                  <ShoppingBag className="h-4.5 w-4.5 text-[var(--gl-accent)]" />
                  {step === 1 && "Giỏ Hàng Sinh Thái Của Bạn"}
                  {step === 2 && "Địa Chỉ Giao Hàng"}
                  {step === 3 && "Thanh Toán & Ghi Chú"}
                </h2>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleClose}
                  aria-label="Đóng giỏ hàng"
                  className="rounded-xl p-2 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Steps Progress Indicator */}
              {!checkoutComplete && cart.length > 0 && (
                <div className="flex justify-between px-5 py-2.5 border-b border-[var(--gl-border)] bg-[var(--gl-bg-muted)]/50 text-[10px] font-mono">
                  <span className={step === 1 ? "text-[var(--gl-accent)] font-bold" : "text-[var(--gl-text-muted)]"}>1. Giỏ hàng</span>
                  <span className="text-[var(--gl-text-muted)]">➔</span>
                  <span className={step === 2 ? "text-[var(--gl-accent)] font-bold" : "text-[var(--gl-text-muted)]"}>2. Địa chỉ</span>
                  <span className="text-[var(--gl-text-muted)]">➔</span>
                  <span className={step === 3 ? "text-[var(--gl-accent)] font-bold" : "text-[var(--gl-text-muted)]"}>3. Thanh toán</span>
                </div>
              )}

              {/* Cart Contents Section */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[var(--gl-bg-page)]">
                
                {/* Error message */}
                {errorMsg && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-[var(--gl-danger)] text-xs font-mono font-medium animate-slide-down">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Checkout message screen */}
                {checkoutComplete && (
                  <div className="text-center py-10 px-4 bg-[var(--gl-accent-soft)]/40 border border-[var(--gl-accent)]/20 rounded-2xl space-y-3">
                    <div className="text-4xl">🌱</div>
                    <h4 className="text-sm font-semibold text-[var(--gl-accent)]">Đặt hàng thành công!</h4>
                    <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed font-mono">
                      Hệ thống đã xác nhận đơn hàng hữu cơ của bạn và tích lũy carbon thăng hạng đóng góp của bạn trên tài khoản GreenLife.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutComplete(false);
                        setStep(1);
                        onClose();
                      }}
                      className="mt-2 text-xs text-[var(--gl-accent)] hover:underline inline-block font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      Tiếp tục khám phá
                    </button>
                  </div>
                )}

                {!checkoutComplete && cart.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="Giỏ hàng trống"
                    description="Giỏ hàng rỗng. Hãy bồi bổ thêm dinh dưỡng đất hoặc cây hoa hồng nhé."
                    action={{
                      label: "Ghé xem cửa hàng ngay",
                      onClick: () => {
                        onClose();
                        setCurrentPage("shop");
                      }
                    }}
                  />
                ) : null}

                {/* STEP 1: REVIEW CART */}
                {!checkoutComplete && step === 1 && cart.length > 0 && (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div 
                        key={item.product.id} 
                        className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-3.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs transition-all hover:border-[var(--gl-border-subtle)]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={getMediaUrl(item.product.image)}
                            alt={item.product.name}
                            className="w-12 h-12 shrink-0 object-cover rounded-xl border border-[var(--gl-border-subtle)] bg-[var(--gl-bg-muted)]"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="font-semibold text-[var(--gl-text-primary)] block truncate" title={item.product.name}>{item.product.name}</span>
                            {item.onSale && item.effectiveUnitPrice !== undefined ? (
                              <div className="space-y-0.5 mt-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-[var(--gl-text-muted)] line-through font-mono">
                                    {item.baseUnitPrice !== undefined
                                      ? item.baseUnitPrice.toLocaleString("vi-VN")
                                      : item.product.price.toLocaleString("vi-VN")}₫
                                  </span>
                                  <span className="text-[10px] font-semibold text-[var(--gl-accent)] font-mono">
                                    {item.effectiveUnitPrice.toLocaleString("vi-VN")}₫
                                  </span>
                                  {item.promotionName && (
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[9px] font-bold font-mono">
                                      {item.promotionName}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[var(--gl-accent)] font-mono block font-bold">
                                  {item.lineEffectiveAmount !== undefined
                                    ? item.lineEffectiveAmount.toLocaleString("vi-VN") + "₫"
                                    : "Đang cập nhật giá"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[var(--gl-text-secondary)] font-mono block mt-0.5 font-semibold">
                                {item.lineBaseAmount !== undefined
                                  ? item.lineBaseAmount.toLocaleString("vi-VN") + "₫"
                                  : item.lineEffectiveAmount !== undefined
                                    ? item.lineEffectiveAmount.toLocaleString("vi-VN") + "₫"
                                    : "Đang cập nhật giá"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                          {/* Dec/Inc Quantity buttons */}
                          <div className="flex items-center bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              aria-label="Giảm số lượng"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 text-xs text-[var(--gl-text-primary)] font-mono font-semibold select-none min-w-[20px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              aria-label="Tăng số lượng"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                            title="Xóa khỏi giỏ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 2: SHIPPING ADDRESS SELECT/CREATE */}
                {!checkoutComplete && step === 2 && (
                  <div className="space-y-4 text-xs">
                    {!showAddAddressForm ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold">Địa chỉ giao hàng đã lưu</span>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(true)}
                            className="text-[var(--gl-accent)] hover:underline flex items-center gap-1 font-bold cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Thêm địa chỉ mới
                          </button>
                        </div>

                        {loadingAddresses ? (
                          <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Đang tải địa chỉ">
                            {[1, 2].map((i) => (
                              <div key={i} className="p-4 border border-[var(--gl-border)] bg-[var(--gl-bg-surface)] rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="h-4 bg-[var(--gl-bg-muted)] rounded w-1/3" />
                                  <div className="h-3 bg-[var(--gl-bg-muted)] rounded w-1/4" />
                                </div>
                                <div className="space-y-1.5">
                                  <div className="h-3.5 bg-[var(--gl-bg-muted)] rounded w-full" />
                                  <div className="h-3.5 bg-[var(--gl-bg-muted)] rounded w-5/6" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : addresses.length === 0 ? (
                          <div className="border border-dashed border-[var(--gl-border)] p-6 rounded-2xl text-center text-[var(--gl-text-muted)]">
                            Chưa có địa chỉ nào được lưu. Vui lòng thêm địa chỉ mới.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {addresses.map((addr) => (
                              <div
                                key={addr.address_id}
                                onClick={() => setSelectedAddressId(addr.address_id || null)}
                                className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                                  selectedAddressId === addr.address_id
                                    ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30"
                                    : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)]"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-[var(--gl-text-primary)] text-[13px]">{addr.fullname}</span>
                                  <span className="font-mono text-[var(--gl-text-muted)]">{addr.phone}</span>
                                </div>
                                <p className="text-[var(--gl-text-secondary)] leading-snug">{addr.detail_address}, {addr.ward}, {addr.district}, {addr.province}</p>
                                
                                <div className="flex gap-2 mt-2">
                                  {addr.is_default && (
                                    <span className="bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold">Mặc định</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Add new address form
                      <form onSubmit={handleCreateAddress} className="bg-[var(--gl-bg-surface)] p-4 border border-[var(--gl-border)] rounded-2xl space-y-3">
                        <h4 className="font-semibold text-[var(--gl-text-primary)] mb-2 border-b border-[var(--gl-border)] pb-2">Thêm Địa Chỉ Mới</h4>
                        
                        {formError && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[var(--gl-danger)] text-[11px] font-mono font-medium animate-slide-down">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.2" />
                            <span>{formError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[var(--gl-text-muted)] font-mono font-semibold uppercase tracking-wider block">Tên người nhận *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Nguyễn Văn A"
                            value={addressForm.fullname}
                            onChange={(e) => setAddressForm({ ...addressForm, fullname: e.target.value })}
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] py-2.5 px-3.5 rounded-xl text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none transition-all text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[var(--gl-text-muted)] font-mono font-semibold uppercase tracking-wider block">Số điện thoại *</label>
                          <input
                            type="tel"
                            required
                            placeholder="Ví dụ: 09XXXXXXXX"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "") })}
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] py-2.5 px-3.5 rounded-xl text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none transition-all text-xs font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--gl-text-muted)] font-mono font-semibold uppercase tracking-wider block">Tỉnh / Thành phố *</label>
                            <select
                              value={addressForm.provinceId || ""}
                              onChange={(e) => handleProvinceSelectChange(e.target.value)}
                              disabled={loadingProvinces}
                              className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] py-2.5 px-3 rounded-xl text-[var(--gl-text-primary)] focus:outline-none transition-all text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                              <option value="" disabled className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)]">
                                {loadingProvinces ? "Đang tải dữ liệu địa chỉ..." : "-- Chọn Tỉnh / Thành phố --"}
                              </option>
                              {provincesList.map(p => (
                                <option key={p.id} value={p.id} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{p.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--gl-text-muted)] font-mono font-semibold uppercase tracking-wider block">Xã / Phường / Đặc khu *</label>
                            <select
                              value={addressForm.communeCode}
                              onChange={(e) => handleCommuneSelectChange(e.target.value)}
                              disabled={!addressForm.provinceId || loadingCommunes}
                              className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] py-2.5 px-3 rounded-xl text-[var(--gl-text-primary)] focus:outline-none transition-all text-xs font-semibold cursor-pointer disabled:opacity-60"
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
                              {communesList.map(c => (
                                <option key={c.code} value={c.code} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{c.displayName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[var(--gl-text-muted)] font-mono font-semibold uppercase tracking-wider block">Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: 123 Lê Lợi"
                            value={addressForm.detailAddress}
                            onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] py-2.5 px-3.5 rounded-xl text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none transition-all text-xs font-semibold"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2 select-none">
                          <input
                            type="checkbox"
                            id="is-default-checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="w-4 h-4 accent-[var(--gl-accent)] cursor-pointer"
                          />
                          <label htmlFor="is-default-checkbox" className="text-[11px] text-[var(--gl-text-secondary)] cursor-pointer font-medium">Đặt làm địa chỉ mặc định</label>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(false)}
                            className="flex-1 min-h-[44px] py-3 border border-[var(--gl-border)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                          >
                            Trở lại
                          </button>
                          <button
                            type="submit"
                            className="flex-1 min-h-[44px] py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                          >
                            Lưu Địa Chỉ
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD & NOTES */}
                {!checkoutComplete && step === 3 && (
                  <div className="space-y-4 text-xs">
                    
                    {/* Selected address review */}
                    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-3.5 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[var(--gl-text-muted)] uppercase font-mono font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[var(--gl-accent)]" /> Địa chỉ giao nhận
                      </div>
                      <p className="text-[var(--gl-text-primary)] mt-1.5 leading-relaxed font-sans">{getSelectedAddressDetails()}</p>
                    </div>

                    {/* Payment methods choice */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold block">Hình thức thanh toán</span>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        
                        <div
                          onClick={() => setPaymentMethod("COD")}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 text-center select-none ${
                            paymentMethod === "COD"
                              ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30 text-[var(--gl-accent)] font-bold shadow-sm"
                              : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)] text-[var(--gl-text-secondary)]"
                          }`}
                        >
                          <CreditCard className={`w-5 h-5 ${paymentMethod === "COD" ? "text-[var(--gl-accent)]" : "text-[var(--gl-text-muted)]"}`} />
                          <span className="font-semibold text-[11px]">Thanh toán COD (Tiền mặt)</span>
                        </div>

                        <div
                          onClick={() => setPaymentMethod("PAYOS")}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 text-center select-none ${
                            paymentMethod === "PAYOS"
                              ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30 text-[var(--gl-accent)] font-bold shadow-sm"
                              : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)] text-[var(--gl-text-secondary)]"
                          }`}
                        >
                          <span className={`text-sm font-black tracking-tighter ${paymentMethod === "PAYOS" ? "text-[var(--gl-accent)]" : "text-[var(--gl-text-muted)]"}`}>PayOS</span>
                          <span className="font-semibold text-[11px]">Cổng PayOS QR</span>
                        </div>

                      </div>
                    </div>

                    {/* Notes textarea */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold block">Ghi chú giao hàng</span>
                      <textarea
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao, hoặc gửi bảo vệ..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full h-20 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl p-3.5 text-[var(--gl-text-primary)] text-xs resize-none placeholder:text-[var(--gl-text-muted)] focus:outline-none transition-all leading-relaxed"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Cart Footer Price totals and transaction action */}
              {!checkoutComplete && cart.length > 0 && (
                <div className="border-t border-[var(--gl-border)] bg-[var(--gl-bg-surface)] p-5 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[var(--gl-text-secondary)] font-medium">Tổng phụ cộng:</span>
                      <span className="text-[var(--gl-text-primary)] font-mono font-semibold">{cartTotal.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gl-text-secondary)] font-medium">Đóng gói hữu cơ:</span>
                      <span className="text-[var(--gl-accent)] text-[10px] font-mono font-bold uppercase">Miễn Phí (Eco Bag)</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--gl-border-subtle)] pt-2.5 font-semibold">
                      <span className="text-[var(--gl-text-primary)]">Tổng cộng giao ước:</span>
                      <span className="text-[var(--gl-accent)] text-sm font-mono font-bold">{cartTotal.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--gl-accent-soft)]/30 border border-[var(--gl-accent)]/20 rounded-xl text-[10px] text-[var(--gl-text-secondary)] leading-normal font-sans">
                    🌿 Mua hàng đóng góp trực tiếp <strong className="text-[var(--gl-accent)] font-bold">-{co2OffsetKg} kg CO₂</strong> khí phát thải bù đắp bảo vệ mầm xanh quốc thổ.
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-600 dark:text-amber-400 leading-normal font-sans flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                    <span>Giá sản phẩm khuyến mãi chỉ được bảo lưu tạm thời và có thể thay đổi khi thanh toán.</span>
                  </div>

                  {/* STEP 1 ACTIONS */}
                  {step === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          toast.error("Vui lòng đăng nhập trước khi thanh toán.");
                          setCurrentPage("auth");
                          onClose();
                          return;
                        }
                        setStep(2);
                      }}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl cursor-pointer transition-all tracking-wider text-[11px] font-mono shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      Chọn Địa Chi Giao Hàng
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  {/* STEP 2 ACTIONS */}
                  {step === 2 && !showAddAddressForm && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3.5 border border-[var(--gl-border)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedAddressId) {
                            toast.error("Vui lòng chọn địa chỉ giao hàng.");
                            return;
                          }
                          setStep(3);
                        }}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                      >
                        Tiếp Tục
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* STEP 3 ACTIONS */}
                  {step === 3 && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setStep(2)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3.5 border border-[var(--gl-border)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleCheckoutSubmit}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                      >
                        {submitting ? "Đang xử lý..." : paymentMethod === "PAYOS" ? "THANH TOÁN PAYOS" : "ĐẶT HÀNG COD"}
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CartDrawer;
