import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from "../../utils/logger";
import { User, ShoppingBag, Activity, Calendar, MapPin, Mail, Shield, Star, Upload, Trash2, X, AlertCircle, Heart } from "lucide-react";
import { Appointment, DiagnosisLog } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { FeedbackService } from "../../services/feedbackService";
import { OrderService } from "../../services/orderService";
import { DashboardSkeleton, ListSkeleton } from "../common/Skeleton";
import { EmptyState } from "../common/EmptyState";

interface CustomerDashboardViewProps {
  appointments: Appointment[];
  diagnosisLogs: DiagnosisLog[];
  setCurrentPage: (page: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  appointments,
  diagnosisLogs,
  setCurrentPage,
}) => {
  const { currentUser, userLocation, stores } = useAppContext();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "shipped" | "completed">("all");
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const data = await OrderService.getOrders(controller.signal);
        setOrders(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          logger.error("Error fetching orders:", err);
        }
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
    return () => {
      controller.abort();
    };
  }, [currentUser?.id, refreshTrigger]);

  const cityStores = useMemo(() => {
    return stores.filter((s) => s.city === userLocation.city);
  }, [stores, userLocation.city]);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "shipped":
        return "Đang vận chuyển";
      case "completed":
        return "Đã giao thành công";
      case "pending":
        return "Chờ xử lý";
      default:
        return "Đang xử lý";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "shipped":
        return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
      default:
        return "bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-400 border border-stone-250 dark:border-stone-800";
    }
  }, []);

  // Helper to check if an order has been fully reviewed
  const isOrderReviewed = useCallback((order: any) => {
    if (!order.itemsList || order.itemsList.length === 0) return true;
    return order.itemsList.every(
      (item: any) => localStorage.getItem(`reviewed_${order.id}_${item.productId}`) === "true"
    );
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => activeTab === "all" || o.status === activeTab);
  }, [orders, activeTab]);

  const reviewsCount = useMemo(() => {
    let count = 0;
    orders.forEach((order) => {
      if (order.itemsList) {
        order.itemsList.forEach((item: any) => {
          if (localStorage.getItem(`reviewed_${order.id}_${item.productId}`) === "true") {
            count++;
          }
        });
      }
    });
    return count;
  }, [orders]);

  const getStatusStep = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return 1;
      case "shipped":
        return 2;
      case "completed":
        return 3;
      default:
        return 1;
    }
  }, []);

  return (
    <div className="space-y-8 pb-20 text-stone-800 dark:text-stone-100">

      {/* Profile summary banner */}
      <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.02] rounded-full blur-3xl -z-10" />

        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <User className="h-8 w-8" />
          </div>
          <div>
            <div className="inline-flex gap-1.5 items-center px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 text-[10px] font-mono font-medium">
              {currentUser?.is_seller ? "🌱 KHÁCH HÀNG & NHÀ VƯỜN" : "⭐ TÀI KHOẢN KHÁCH HÀNG"}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1.5">
              {currentUser?.name || "Nguyễn Hoàng Long"}
            </h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">ID: GL-CUST-{currentUser?.id.slice(-6).toUpperCase() || "83921"}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-850 pt-4 md:pt-0 md:pl-8 justify-between md:justify-start">
          <div className="text-center md:text-left">
            <span className="text-[10px] text-stone-405 dark:text-stone-500 font-mono block">Ngày tham gia:</span>
            <span className="text-sm font-semibold text-stone-705 dark:text-stone-300 block mt-1">
              {currentUser?.registeredDate || "2025-01-10"}
            </span>
          </div>

          <div>
            {currentUser?.is_seller ? (
              <button
                onClick={() => {
                  setCurrentPage("store-dashboard");
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase rounded-xl transition-all shadow-sm tracking-wider cursor-pointer font-mono"
              >
                Kênh Người Bán 🌿
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage("store-profile-setup");
                }}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-emerald-450 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-450/40 text-xs font-bold uppercase rounded-xl transition-all shadow-sm tracking-wider cursor-pointer font-mono"
              >
                Đăng Ký Bán Hàng 🛒
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Tổng đơn mua", value: orders.length, icon: ShoppingBag, color: "text-emerald-600 dark:text-emerald-450", bg: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20" },
          { label: "Đang vận chuyển", value: orders.filter(o => o.status === "shipped").length, icon: Activity, color: "text-amber-600 dark:text-amber-450", bg: "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20" },
          { label: "Đã nhận hàng", value: orders.filter(o => o.status === "completed").length, icon: Shield, color: "text-blue-600 dark:text-blue-450", bg: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/60 dark:border-blue-900/20" },
          { label: "Đã đánh giá", value: reviewsCount, icon: Star, color: "text-purple-600 dark:text-purple-450", bg: "bg-purple-50/50 dark:bg-purple-950/10 border-purple-100/60 dark:border-purple-900/20" },
          { label: "Mục yêu thích", value: currentUser?.savedProductIds?.length || 0, icon: Heart, color: "text-rose-600 dark:text-rose-455", bg: "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/60 dark:border-rose-900/20" }
        ].map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-xs transition-all hover:scale-[1.02] duration-200 ${kpi.bg}`}>
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider leading-tight">{kpi.label}</span>
                <IconComponent className={`w-4 h-4 shrink-0 ${kpi.color}`} />
              </div>
              <span className={`text-2xl font-extrabold font-mono leading-none ${kpi.color}`}>{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Account Info & Nearby Stores */}
        <div className="lg:col-span-5 space-y-6">

          {/* Account Details */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-stone-200 dark:border-stone-850 pb-3">
              <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
              Thông Tin Tài Khoản
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono">Họ tên:</span>
                <span className="font-semibold text-stone-705 dark:text-stone-200">{currentUser?.name || "Nguyễn Hoàng Long"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono">Email:</span>
                <span className="font-semibold text-stone-705 dark:text-stone-200 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-stone-400" />
                  {currentUser?.email || "vip.customer@greenlife.vn"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono">Vai trò:</span>
                <span className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-850 text-stone-700 dark:text-stone-300 font-semibold uppercase text-[10px]">
                  {currentUser?.is_seller ? "Người mua & Người bán" : "Khách hàng"}
                </span>
              </div>
              {currentUser?.is_seller && (
                <>
                  <div className="flex justify-between items-center py-1 border-t border-stone-105 dark:border-stone-900/60 pt-2">
                    <span className="text-stone-400 font-mono">Tên Shop:</span>
                    <span className="font-semibold text-stone-705 dark:text-emerald-400">{currentUser.shop_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-400 font-mono">Tài khoản Bank:</span>
                    <span className="font-semibold text-stone-705 dark:text-stone-300 font-mono">{currentUser.bank_account}</span>
                  </div>
                </>
              )}
              <div className="flex flex-col gap-1 py-1">
                <span className="text-stone-400 font-mono">Địa chỉ mặc định:</span>
                <span className="font-semibold text-stone-705 dark:text-stone-300 leading-relaxed bg-stone-100 dark:bg-stone-900/60 p-2 rounded-xl border border-stone-200 dark:border-stone-850 mt-1 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
                  {userLocation.address}
                </span>
              </div>
            </div>
          </div>

          {/* Nearby Stores */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
                Cửa Hàng Gần Tôi ({userLocation.city})
              </h3>
              <p className="text-[10px] text-stone-550 dark:text-stone-400 mt-1">Các đối tác cung ứng cây cảnh & chế phẩm sinh học quanh khu vực của bạn.</p>
            </div>

            {cityStores.length === 0 ? (
              <div className="py-2">
                <EmptyState
                  icon={MapPin}
                  title="Không tìm thấy vườn"
                  description={`Hiện tại chưa có cửa hàng đối tác liên kết trực tiếp tại khu vực ${userLocation.city}.`}
                />
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cityStores.map((store) => (
                  <div key={store.id} className="p-3.5 bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">{store.name}</h4>
                        <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{store.address}</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500 text-black font-mono font-bold shrink-0">
                        ⭐ {store.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-stone-400 border-t border-stone-200 dark:border-stone-800/60 pt-2 font-mono">
                      <span>🕒 {store.workingHours}</span>
                      <span>Khu vực giao: <strong className="text-emerald-600 dark:text-emerald-450">{store.serviceArea || "Mọi quận huyện"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Orders, Bookings, Diagnosis */}
        <div className="lg:col-span-7 space-y-6">

          {/* My Orders (Shopee Flow) */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
              Đơn Mua Của Tôi
            </h3>

            {/* Shopee-style tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-850 text-xs font-semibold overflow-x-auto pb-1 mb-4 gap-1.5 scrollbar-thin">
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending", label: "Chờ xử lý" },
                { id: "shipped", label: "Đang giao" },
                { id: "completed", label: "Đã giao" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
                      : "border-transparent text-stone-400 hover:text-stone-750 dark:hover:text-stone-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingOrders && orders.length === 0 ? (
                <ListSkeleton count={3} />
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Không có đơn mua"
                  description="Bạn chưa có đơn đặt mua sản phẩm sinh học nào."
                  action={{
                    label: "Khám phá sản phẩm ngay 🌿",
                    onClick: () => setCurrentPage("shop")
                  }}
                />
              ) : (
                filteredOrders.map((ord) => {
                  const currentStep = getStatusStep(ord.status);
                  return (
                    <div key={ord.id} className="p-5 bg-stone-100/60 dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-stone-850 flex flex-col gap-4 text-xs shadow-xs hover:border-stone-300 dark:hover:border-stone-800 transition-all">
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-4 pb-3 border-b border-stone-200/50 dark:border-stone-850/50">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded-md font-mono font-bold">
                              ĐƠN HÀNG
                            </span>
                            <h4 className="font-mono font-bold text-stone-800 dark:text-stone-100 text-sm">{ord.id}</h4>
                          </div>
                          <span className="text-[10px] text-stone-450 dark:text-stone-500 font-mono block">Ngày đặt: {ord.date}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wide ${getStatusColor(ord.status)}`}>
                          {getStatusLabel(ord.status)}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-3 py-1">
                        {ord.itemsList && ord.itemsList.length > 0 ? (
                          ord.itemsList.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-10 h-10 object-cover rounded-lg border border-stone-200 dark:border-stone-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <h5 className="font-semibold text-stone-800 dark:text-stone-200 line-clamp-1">{item.productName}</h5>
                                  <span className="text-[10px] text-stone-400 font-mono">Số lượng: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="font-mono text-stone-700 dark:text-stone-300 font-medium">
                                {(item.unitPrice || 0).toLocaleString("vi-VN")}₫
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-stone-500 italic line-clamp-2">{ord.items}</p>
                        )}
                      </div>

                      {/* Timeline Flow */}
                      <div className="py-2.5 px-1 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-200/50 dark:border-stone-850/50 my-1">
                        <div className="flex items-center justify-between relative px-6">
                          {/* Progress Line */}
                          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-stone-250 dark:bg-stone-850 -translate-y-1/2 -z-10">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%" }}
                            />
                          </div>

                          {[
                            { step: 1, label: "Chờ duyệt" },
                            { step: 2, label: "Đang giao" },
                            { step: 3, label: "Đã nhận" }
                          ].map((s) => {
                            const isPast = currentStep >= s.step;
                            const isCurrent = currentStep === s.step;
                            return (
                              <div key={s.step} className="flex flex-col items-center gap-1.5 shrink-0">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all font-mono text-[9px] font-bold ${isPast
                                    ? "bg-emerald-500 border-emerald-500 text-black shadow-xs"
                                    : "bg-stone-100 dark:bg-stone-900 border-stone-350 dark:border-stone-800 text-stone-400"
                                  }`}>
                                  {s.step}
                                </div>
                                <span className={`text-[9px] font-semibold tracking-tight ${isCurrent
                                    ? "text-emerald-600 dark:text-emerald-450 font-bold"
                                    : isPast
                                      ? "text-stone-600 dark:text-stone-300"
                                      : "text-stone-400"
                                  }`}>
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer row: Total and Action */}
                      <div className="flex justify-between items-center pt-3 border-t border-stone-200/50 dark:border-stone-850/50 mt-1">
                        <div>
                          <span className="text-[10px] text-stone-450 dark:text-stone-500 block">Tổng thanh toán:</span>
                          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-450">
                            {ord.total.toLocaleString("vi-VN")}₫
                          </span>
                        </div>

                        {ord.status === "completed" && (
                          <div>
                            {isOrderReviewed(ord) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-455 font-bold bg-emerald-500/10 dark:bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                ✓ Đã đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedOrderForReview(ord)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 duration-150"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                Đánh giá sản phẩm
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Booked Services */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
              Lịch Đặt Dịch Vụ Của Tôi
            </h3>

            {appointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Không có lịch hẹn"
                description="Chưa có cuộc hẹn khảo sát ban công nào được đăng ký."
                action={{
                  label: "Tìm đặt cuộc hẹn cùng kỹ sư",
                  onClick: () => setCurrentPage("booking")
                }}
              />
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="p-4 bg-stone-100 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-stone-800 dark:text-stone-200">{apt.expertName}</h4>
                      <p className="text-[10px] text-stone-500 mt-1 font-mono">🗓️ {apt.date} lúc {apt.time}</p>
                      <p className="text-[9px] text-stone-400 mt-0.5">Hình thức: {apt.type === "offline" ? "Tại vườn" : "Zoom Call"}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      Xác nhận
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Diagnosis History */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
              Lịch Sử AI Chẩn Đoán Gần Đây
            </h3>

            {diagnosisLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Chưa có chẩn đoán"
                description="Bạn chưa kiểm tra bệnh lá cây nào bằng camera AI."
                action={{
                  label: "Chụp ảnh chẩn đoán thử ngay",
                  onClick: () => setCurrentPage("ai-diagnosis")
                }}
              />
            ) : (
              <div className="space-y-3">
                {diagnosisLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-4 bg-stone-100 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-stone-800 dark:text-stone-200 line-clamp-1">{log.diseaseName}</h4>
                      <p className="text-[10px] text-stone-500 mt-1">Đối tượng: {log.plantName}</p>
                      <p className="text-[9px] text-stone-400 mt-0.5">Ngày quét: {log.date}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-rose-105 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/10 shrink-0 font-mono font-semibold">
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {selectedOrderForReview && (
        <FeedbackModal
          order={selectedOrderForReview}
          onClose={() => setSelectedOrderForReview(null)}
          onSubmitted={() => {
            setSelectedOrderForReview(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

interface FeedbackModalProps {
  order: any;
  onClose: () => void;
  onSubmitted: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, onClose, onSubmitted }) => {
  const { currentUser } = useAppContext();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [reviewsState, setReviewsState] = useState<any[]>(() => {
    return (order.itemsList || []).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      imageUrl: item.imageUrl,
      rating: 5,
      hoverRating: 0,
      comment: "",
      previews: [] as string[],
      imagesBase64: [] as string[]
    }));
  });

  const handleRatingChange = (idx: number, rating: number) => {
    setReviewsState(prev => {
      const updated = [...prev];
      updated[idx].rating = rating;
      return updated;
    });
  };

  const handleHoverRating = (idx: number, rating: number) => {
    setReviewsState(prev => {
      const updated = [...prev];
      updated[idx].hoverRating = rating;
      return updated;
    });
  };

  const handleCommentChange = (idx: number, text: string) => {
    setReviewsState(prev => {
      const updated = [...prev];
      updated[idx].comment = text.slice(0, 250);
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, productIndex: number) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const previewUrl = URL.createObjectURL(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        setReviewsState(prev => {
          const updated = [...prev];
          updated[productIndex].previews = [...(updated[productIndex].previews || []), previewUrl];
          updated[productIndex].imagesBase64 = [...(updated[productIndex].imagesBase64 || []), base64Str];
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (productIndex: number, imgIndex: number) => {
    setReviewsState(prev => {
      const updated = [...prev];
      updated[productIndex].previews = updated[productIndex].previews.filter((_: any, i: number) => i !== imgIndex);
      updated[productIndex].imagesBase64 = updated[productIndex].imagesBase64.filter((_: any, i: number) => i !== imgIndex);
      return updated;
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Tệ";
      case 2: return "Không hài lòng";
      case 3: return "Bình thường";
      case 4: return "Hài lòng";
      case 5: return "Tuyệt vời";
      default: return "";
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      for (const rev of reviewsState) {
        const payload = {
          productId: rev.productId,
          userId: currentUser?.id || "user-1",
          orderId: order.id,
          rating: rev.rating,
          comment: rev.comment,
          images: rev.imagesBase64
        };

        const res = await FeedbackService.submitFeedback(payload);
        if (!res.success) {
          throw new Error(res.message);
        }

        localStorage.setItem(`reviewed_${order.id}_${rev.productId}`, "true");
      }

      onSubmitted();
    } catch (err: any) {
      setSubmitError(err.message || "Gặp sự cố khi gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-5 bg-stone-50 dark:bg-stone-950/40">
          <h2 className="text-sm font-bold text-stone-850 dark:text-white flex items-center gap-2">
            <Star className="h-4.5 w-4.5 text-amber-400 fill-current" />
            Đánh Giá Đơn Hàng {order.id}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-stone-900">
          {submitError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {reviewsState.map((rev, productIdx) => (
            <div key={rev.productId} className="space-y-4 border-b border-stone-150 dark:border-stone-800/80 pb-6 last:border-0 last:pb-0">
              {/* Product Info Banner */}
              <div className="flex items-center gap-3">
                <img
                  src={rev.imageUrl}
                  alt={rev.productName}
                  className="w-12 h-12 object-cover rounded-xl border border-stone-200 dark:border-stone-850"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-850 dark:text-white line-clamp-1">{rev.productName}</h4>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">Mã SP: {rev.productId}</p>
                </div>
              </div>

              {/* Interactive Stars Rating */}
              <div className="flex items-center gap-3 bg-stone-55 dark:bg-stone-950/40 p-3 rounded-2xl border border-stone-200 dark:border-stone-850/50">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Chất lượng sản phẩm:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isStarred = star <= (rev.hoverRating || rev.rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(productIdx, star)}
                        onMouseEnter={() => handleHoverRating(productIdx, star)}
                        onMouseLeave={() => handleHoverRating(productIdx, 0)}
                        className="p-1 cursor-pointer transform active:scale-90 transition-transform"
                      >
                        <Star
                          className={`w-5.5 h-5.5 transition-colors duration-200 ${
                            isStarred
                              ? "text-amber-400 fill-current"
                              : "text-stone-300 dark:text-stone-800"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-amber-555 dark:text-amber-400 font-semibold select-none font-mono">
                  {getRatingLabel(rev.rating)}
                </span>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1">
                <textarea
                  value={rev.comment}
                  onChange={(e) => handleCommentChange(productIdx, e.target.value)}
                  placeholder="Chia sẻ cảm nhận chân thực về chất lượng sản phẩm, rễ cây có đầm không, đóng gói có an tâm không nhé..."
                  className="w-full h-24 p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 hover:border-stone-350 dark:hover:border-stone-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-stone-850 dark:text-stone-200 text-xs resize-none placeholder:text-stone-400 dark:placeholder:text-stone-600 transition-all focus:outline-none"
                />
                <div className="flex justify-end text-[9px] text-stone-500 font-mono">
                  {rev.comment.length} / 250 ký tự
                </div>
              </div>

              {/* Image Uploader Grid */}
              <div className="space-y-2">
                <span className="text-[10px] text-stone-400 font-mono block">Hình ảnh thực tế đính kèm:</span>
                <div className="flex flex-wrap gap-2.5">
                  {/* Render Previews */}
                  {rev.previews.map((preview: string, imgIdx: number) => (
                    <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 group">
                      <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(productIdx, imgIdx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-500 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {rev.previews.length < 5 && (
                    <label className="w-16 h-16 border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 bg-stone-50 dark:bg-stone-950 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-all cursor-pointer select-none">
                      <Upload className="w-4 h-4 mb-1 text-stone-500 dark:text-stone-400" />
                      <span className="text-[8px] font-mono font-semibold uppercase">Đính ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageChange(e, productIdx)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-stone-250 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Trở Lại
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl transition-all tracking-wide cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Đang gửi..." : "Hoàn Tất Đánh Giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

