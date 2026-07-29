import React, { useState, useEffect, useRef } from "react";
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
import { UserAddress, CartItem } from "../../types";
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

  // Selected cart item IDs state
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<number[]>([]);
  const prevCartItemIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  // Sync selectedCartItemIds when cart updates
  useEffect(() => {
    const currentItemIds = cart
      .map(item => item.id)
      .filter((id): id is number => id !== undefined);

    if (currentItemIds.length === 0) {
      setSelectedCartItemIds([]);
      prevCartItemIdsRef.current = new Set();
      return;
    }

    if (!initializedRef.current) {
      setSelectedCartItemIds(currentItemIds);
      prevCartItemIdsRef.current = new Set(currentItemIds);
      initializedRef.current = true;
      return;
    }

    setSelectedCartItemIds(prev => {
      const currentSet = new Set(currentItemIds);
      const pruned = prev.filter(id => currentSet.has(id));
      const newlyAdded = currentItemIds.filter(id => !prevCartItemIdsRef.current.has(id));
      return Array.from(new Set([...pruned, ...newlyAdded]));
    });

    prevCartItemIdsRef.current = new Set(currentItemIds);
  }, [cart]);

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

  // Selection calculations
  const validCartItems = cart.filter((item): item is CartItem & { id: number } => item.id !== undefined);
  const isAllSelected = validCartItems.length > 0 && validCartItems.every(item => selectedCartItemIds.includes(item.id));

  const selectedSubtotal = cart
    .filter(item => item.id !== undefined && selectedCartItemIds.includes(item.id))
    .reduce((sum, item) => {
      const lineAmount = item.lineEffectiveAmount !== undefined
        ? item.lineEffectiveAmount
        : item.lineBaseAmount !== undefined
          ? item.lineBaseAmount
          : (item.effectiveUnitPrice ?? item.product.price) * item.quantity;
      return sum + lineAmount;
    }, 0);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCartItemIds([]);
    } else {
      setSelectedCartItemIds(validCartItems.map(i => i.id));
    }
  };

  const handleToggleItemSelect = (itemId: number) => {
    setSelectedCartItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

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

    if (selectedCartItemIds.length === 0) {
      const msg = "Vui lòng chọn ít nhất một sản phẩm trong giỏ hàng để thanh toán.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!selectedAddressId) {
      toast.error("Vui lòng chọn hoặc tạo địa chỉ giao hàng.");
      return;
    }

    // PayOS Single-Store Frontend Guard
    if (paymentMethod === "PAYOS") {
      const selectedItems = cart.filter(item => item.id !== undefined && selectedCartItemIds.includes(item.id));
      const distinctStores = new Set<number>();
      selectedItems.forEach(item => {
        const sId = item.storeId ?? (item.product.shopId ? Number(item.product.shopId) : undefined);
        if (sId !== undefined && !isNaN(sId)) {
          distinctStores.add(sId);
        }
      });

      if (distinctStores.size > 1) {
        const errorText = "Thanh toán PayOS hiện tại chỉ hỗ trợ sản phẩm từ một cửa hàng trong mỗi lần thanh toán. Vui lòng chọn sản phẩm của một cửa hàng hoặc sử dụng COD.";
        setErrorMsg(errorText);
        toast.error(errorText);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const selected = addresses.find(a => a.address_id === selectedAddressId);
      const checkoutPayload = {
        cartItemIds: selectedCartItemIds,
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
          setSubmitting(false);
          return;
        }
      }

      setCheckoutComplete(true);
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
                    {/* Select All Header */}
                    <div className="flex items-center justify-between p-3 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold select-none text-[var(--gl-text-primary)]">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer"
                        />
                        <span>Chọn tất cả ({selectedCartItemIds.length}/{validCartItems.length})</span>
                      </label>
                    </div>

                    {cart.map((item) => (
                      <div 
                        key={item.product.id} 
                        className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-3.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs transition-all hover:border-[var(--gl-border-subtle)]"
                      >
                        {/* Item Selection Checkbox */}
                        {item.id !== undefined && (
                          <input
                            type="checkbox"
                            checked={selectedCartItemIds.includes(item.id)}
                            onChange={() => handleToggleItemSelect(item.id)}
                            className="w-4 h-4 rounded text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer shrink-0"
                            aria-label={`Chọn sản phẩm ${item.product.name}`}
                          />
                        )}

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
                          <div className="text-center py-8 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl space-y-3">
                            <MapPin className="w-8 h-8 text-[var(--gl-text-muted)] mx-auto opacity-50" />
                            <p className="text-xs text-[var(--gl-text-secondary)]">Bạn chưa có địa chỉ giao hàng nào.</p>
                            <button
                              type="button"
                              onClick={() => setShowAddAddressForm(true)}
                              className="px-4 py-2 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white font-bold rounded-xl text-xs cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                            >
                              Tạo địa chỉ giao hàng
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {addresses.map((addr) => (
                              <label
                                key={addr.address_id}
                                className={`block p-4 border rounded-2xl cursor-pointer transition-all relative ${
                                  selectedAddressId === addr.address_id
                                    ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/20 shadow-xs"
                                    : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="selectedAddress"
                                      checked={selectedAddressId === addr.address_id}
                                      onChange={() => setSelectedAddressId(addr.address_id || null)}
                                      className="text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer mt-0.5"
                                    />
                                    <span className="font-semibold text-[var(--gl-text-primary)]">{addr.fullname}</span>
                                    {addr.is_default && (
                                      <span className="px-2 py-0.5 bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[9px] font-bold rounded-full uppercase tracking-wider font-mono">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[var(--gl-text-secondary)] font-mono">{addr.phone}</span>
                                </div>
                                <p className="mt-2 text-[var(--gl-text-secondary)] text-xs pl-6 leading-relaxed">
                                  {addr.detail_address}, {addr.ward}, {addr.district}, {addr.province}
                                </p>
                              </label>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* NEW ADDRESS FORM */
                      <form onSubmit={handleCreateAddress} className="space-y-3 bg-[var(--gl-bg-surface)] p-4 border border-[var(--gl-border)] rounded-2xl animate-fade-in">
                        <div className="flex justify-between items-center border-b border-[var(--gl-border)] pb-2 mb-3">
                          <span className="font-bold text-[var(--gl-text-primary)]">Tạo địa chỉ giao hàng mới</span>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(false)}
                            className="text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] text-xs cursor-pointer focus:outline-none"
                          >
                            Hủy bỏ
                          </button>
                        </div>

                        {formError && (
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[11px] font-mono">
                            {formError}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-wider font-mono font-bold">Tên người nhận *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.fullname}
                            onChange={(e) => setAddressForm({ ...addressForm, fullname: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3.5 py-2 text-[var(--gl-text-primary)] text-xs focus:outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-wider font-mono font-bold">Số điện thoại *</label>
                          <input
                            type="tel"
                            required
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            placeholder="0912345678"
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3.5 py-2 text-[var(--gl-text-primary)] text-xs focus:outline-none transition-all font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-wider font-mono font-bold">Tỉnh / Thành phố *</label>
                            <select
                              value={addressForm.provinceId || ""}
                              onChange={(e) => handleProvinceSelectChange(e.target.value)}
                              disabled={loadingProvinces}
                              className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3 py-2 text-[var(--gl-text-primary)] text-xs focus:outline-none transition-all"
                            >
                              <option value="">-- Chọn Tỉnh/TP --</option>
                              {provincesList.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-wider font-mono font-bold">Phường / Xã *</label>
                            <select
                              value={addressForm.communeCode}
                              onChange={(e) => handleCommuneSelectChange(e.target.value)}
                              disabled={loadingCommunes || !addressForm.provinceId}
                              className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3 py-2 text-[var(--gl-text-primary)] text-xs focus:outline-none transition-all"
                            >
                              <option value="">-- Chọn Phường/Xã --</option>
                              {communesList.map((c) => (
                                <option key={c.code} value={c.code}>{c.displayName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-wider font-mono font-bold">Địa chỉ chi tiết (Số nhà, tên đường...) *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.detailAddress}
                            onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                            placeholder="Số 123 Đường Nguyễn Huệ..."
                            className="w-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3.5 py-2 text-[var(--gl-text-primary)] text-xs focus:outline-none transition-all"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] rounded"
                          />
                          <span className="text-xs text-[var(--gl-text-secondary)]">Đặt làm địa chỉ mặc định</span>
                        </label>

                        <button
                          type="submit"
                          className="w-full mt-2 py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                        >
                          Lưu địa chỉ
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD & NOTE */}
                {!checkoutComplete && step === 3 && (
                  <div className="space-y-4 text-xs">
                    
                    {/* Address summary */}
                    <div className="p-3.5 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold">Giao đến</span>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-[var(--gl-accent)] text-[10px] hover:underline font-mono cursor-pointer"
                        >
                          Thay đổi
                        </button>
                      </div>
                      <p className="text-xs text-[var(--gl-text-primary)] font-medium leading-relaxed">
                        {getSelectedAddressDetails()}
                      </p>
                    </div>

                    {/* Payment methods */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold block">Phương thức thanh toán</span>

                      <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "COD" ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/20 shadow-xs" : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)]"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer mt-1"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[var(--gl-text-primary)] block">Thanh toán khi nhận hàng (COD)</span>
                          <span className="text-[11px] text-[var(--gl-text-secondary)] block">Thanh toán tiền mặt cho shipper khi nhận được kiện hàng sinh thái.</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === "PAYOS" ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/20 shadow-xs" : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)]"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === "PAYOS"}
                          onChange={() => setPaymentMethod("PAYOS")}
                          className="text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer mt-1"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--gl-text-primary)]">Thanh toán Online PayOS</span>
                            <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-500 text-[9px] font-bold font-mono rounded">Nhanh chóng</span>
                          </div>
                          <span className="text-[11px] text-[var(--gl-text-secondary)] block">Thanh toán trực tuyến chuyển khoản ngân hàng qua mã QR VietQR PayOS.</span>
                        </div>
                      </label>
                    </div>

                    {/* Note input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--gl-text-muted)] uppercase tracking-widest font-mono font-bold block">Ghi chú đơn hàng (Tùy chọn)</label>
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
                      <span className="text-[var(--gl-text-primary)] font-mono font-semibold">{selectedSubtotal.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gl-text-secondary)] font-medium">Đóng gói hữu cơ:</span>
                      <span className="text-[var(--gl-accent)] text-[10px] font-mono font-bold uppercase">Miễn Phí (Eco Bag)</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--gl-border-subtle)] pt-2.5 font-semibold">
                      <span className="text-[var(--gl-text-primary)]">Tổng cộng giao ước:</span>
                      <span className="text-[var(--gl-accent)] text-sm font-mono font-bold">{selectedSubtotal.toLocaleString("vi-VN")}₫</span>
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
                      disabled={selectedCartItemIds.length === 0}
                      onClick={() => {
                        if (!currentUser) {
                          toast.error("Vui lòng đăng nhập trước khi thanh toán.");
                          setCurrentPage("auth");
                          onClose();
                          return;
                        }
                        if (selectedCartItemIds.length === 0) {
                          toast.error("Vui lòng chọn ít nhất một sản phẩm trong giỏ hàng để thanh toán.");
                          return;
                        }
                        setStep(2);
                      }}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl cursor-pointer transition-all tracking-wider text-[11px] font-mono shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        disabled={submitting || selectedCartItemIds.length === 0}
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
