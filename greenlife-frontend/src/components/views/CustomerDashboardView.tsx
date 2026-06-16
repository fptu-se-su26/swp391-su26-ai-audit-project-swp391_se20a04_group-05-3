import React, { useState, useEffect } from "react";
import { User, ShoppingBag, Activity, Calendar, MapPin, Mail, Shield, Star, Upload, Trash2, X, AlertCircle } from "lucide-react";
import { Appointment, DiagnosisLog } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { FeedbackService } from "../../services/feedbackService";

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
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const storedUser = localStorage.getItem("greenlife_current_user");
        const token = storedUser ? JSON.parse(storedUser).token : null;

        const res = await fetch(`/api/orders/user/${currentUser?.id || "cust-1"}`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [currentUser, refreshTrigger]);

  const cityStores = stores.filter((s) => s.city === userLocation.city);

  const getStatusLabel = (status: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "shipped":
        return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
      default:
        return "bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-400 border border-stone-250 dark:border-stone-800";
    }
  };

  // Helper to check if an order has been fully reviewed
  const isOrderReviewed = (order: any) => {
    if (!order.itemsList || order.itemsList.length === 0) return true;
    return order.itemsList.every(
      (item: any) => localStorage.getItem(`reviewed_${order.id}_${item.productId}`) === "true"
    );
  };


  return (
    <div className="space-y-10 pb-20 text-stone-800 dark:text-stone-100">
      
      {/* Profile summary banner */}
      <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.02] rounded-full blur-3xl -z-10" />
        
        <div className="flex gap-4 items-center">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <User className="h-8 w-8" />
          </div>
          <div>
            <div className="inline-flex gap-1.5 items-center px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-medium">
              {currentUser?.is_seller ? "🌱 KHÁCH HÀNG & NHÀ VƯỜN" : "⭐ TÀI KHOẢN KHÁCH HÀNG"}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1.5">
              {currentUser?.name || "Nguyễn Hoàng Long"}
            </h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">ID: GL-CUST-{currentUser?.id.slice(-6).toUpperCase() || "83921"}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 pt-4 md:pt-0 md:pl-8">
          <div className="text-center md:text-left">
            <span className="text-[10px] text-stone-400 font-mono block">Ngày tham gia:</span>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 block mt-1">
              {currentUser?.registeredDate || "2025-01-10"}
            </span>
          </div>

          <div>
            {currentUser?.is_seller ? (
              <button
                onClick={() => {
                  setCurrentPage("store-dashboard");
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase rounded-xl transition-all shadow-sm tracking-wider cursor-pointer"
              >
                Kênh Người Bán 🌿
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage("store-profile-setup");
                }}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-emerald-400 border border-emerald-500/20 hover:border-emerald-400/40 text-xs font-bold uppercase rounded-xl transition-all shadow-sm tracking-wider cursor-pointer"
              >
                Đăng Ký Bán Hàng 🛒
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Account Info & Nearby Stores */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Account Details */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-stone-200 dark:border-stone-850 pb-3">
              <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Thông Tin Tài Khoản
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono">Họ tên:</span>
                <span className="font-semibold text-stone-700 dark:text-stone-200">{currentUser?.name || "Nguyễn Hoàng Long"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono">Email:</span>
                <span className="font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1">
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
                  <div className="flex justify-between items-center py-1 border-t border-stone-100 dark:border-stone-900/60 pt-2">
                    <span className="text-stone-400 font-mono">Tên Shop:</span>
                    <span className="font-semibold text-stone-705 dark:text-emerald-400">{currentUser.shop_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-400 font-mono">Tài khoản Bank:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono">{currentUser.bank_account}</span>
                  </div>
                </>
              )}
              <div className="flex flex-col gap-1 py-1">
                <span className="text-stone-400 font-mono">Địa chỉ mặc định:</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-100 dark:bg-stone-900/60 p-2 rounded-xl border border-stone-200 dark:border-stone-850 mt-1 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  {userLocation.address}
                </span>
              </div>
            </div>
          </div>

          {/* Nearby Stores */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                Cửa Hàng Gần Tôi ({userLocation.city})
              </h3>
              <p className="text-[10px] text-stone-500 mt-1">Các đối tác cung ứng cây cảnh & chế phẩm sinh học quanh khu vực của bạn.</p>
            </div>
            
            {cityStores.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">Không tìm thấy vườn đối tác tại khu vực này.</p>
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
                      <span>Khu vực giao: <strong className="text-emerald-600 dark:text-emerald-400">{store.serviceArea || "Mọi quận huyện"}</strong></span>
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
              <ShoppingBag className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
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
                  className={`px-4 py-2 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-stone-400 hover:text-stone-750 dark:hover:text-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingOrders ? (
                <div className="text-center py-8 text-stone-500 text-xs font-mono">Đang tải danh sách đơn hàng...</div>
              ) : orders.filter(o => activeTab === "all" || o.status === activeTab).length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs font-mono">Không tìm thấy đơn hàng nào.</div>
              ) : (
                orders
                  .filter(o => activeTab === "all" || o.status === activeTab)
                  .map((ord) => (
                    <div key={ord.id} className="p-4 bg-stone-100 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between gap-4 text-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono font-bold text-stone-800 dark:text-stone-100">{ord.id}</h4>
                            <span className="text-[10px] text-stone-400 font-mono">({ord.date})</span>
                          </div>
                          <p className="text-[10px] text-stone-500 line-clamp-1">{ord.items}</p>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            {ord.total.toLocaleString("vi-VN")}₫ • {ord.itemsCount} sản phẩm
                          </span>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono text-center self-start sm:self-auto ${getStatusColor(ord.status)}`}>
                            {getStatusLabel(ord.status)}
                          </span>
                        </div>
                      </div>

                      {/* Review actions if completed */}
                      {ord.status === "completed" && (
                        <div className="flex justify-end border-t border-stone-200/40 dark:border-stone-800/40 pt-3 mt-1">
                          {isOrderReviewed(ord) ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Đã hoàn thành đánh giá
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedOrderForReview(ord)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 duration-200"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              Đánh Giá
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Booked Services */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Lịch Đặt Dịch Vụ Của Tôi
            </h3>

            {appointments.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Chưa có cuộc hẹn khảo sát ban công nào được đăng ký.
                <button 
                  onClick={() => setCurrentPage("booking")}
                  className="block mt-2 text-emerald-650 dark:text-emerald-400 text-xs hover:underline mx-auto font-medium"
                >
                  Tìm đặt cuộc hẹn cùng kỹ sư
                </button>
              </div>
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
              <Activity className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Lịch Sử AI Chẩn Đoán Gần Đây
            </h3>

            {diagnosisLogs.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Bạn chưa kiểm tra bệnh lá cây nào bằng camera AI.
                <button 
                  onClick={() => setCurrentPage("ai-diagnosis")}
                  className="block mt-2 text-emerald-650 dark:text-emerald-400 text-xs hover:underline mx-auto font-medium"
                >
                  Chụp ảnh chẩn đoán thử ngay
                </button>
              </div>
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Star className="h-4.5 w-4.5 text-amber-400 fill-current" />
            Đánh Giá Đơn Hàng {order.id}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 bg-stone-950 hover:bg-stone-800 text-stone-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {submitError && (
            <div className="p-4 bg-rose-950/35 border border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {reviewsState.map((rev, productIdx) => (
            <div key={rev.productId} className="space-y-4 border-b border-stone-800/80 pb-6 last:border-0 last:pb-0">
              {/* Product Info Banner */}
              <div className="flex items-center gap-3">
                <img
                  src={rev.imageUrl}
                  alt={rev.productName}
                  className="w-12 h-12 object-cover rounded-xl border border-stone-850"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{rev.productName}</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Mã SP: {rev.productId}</p>
                </div>
              </div>

              {/* Interactive Stars Rating */}
              <div className="flex items-center gap-3 bg-stone-950/40 p-3 rounded-2xl border border-stone-850/50">
                <span className="text-xs text-stone-400 font-mono">Chất lượng sản phẩm:</span>
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
                              : "text-stone-750 dark:text-stone-800"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-amber-400 font-semibold select-none font-mono">
                  {getRatingLabel(rev.rating)}
                </span>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1">
                <textarea
                  value={rev.comment}
                  onChange={(e) => handleCommentChange(productIdx, e.target.value)}
                  placeholder="Chia sẻ cảm nhận chân thực về chất lượng sản phẩm, rễ cây có đầm không, đóng gói có an tâm không nhé..."
                  className="w-full h-24 p-3 bg-stone-950 border border-stone-850 hover:border-stone-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-stone-200 text-xs resize-none placeholder:text-stone-600 transition-all focus:outline-none"
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
                    <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-800 group">
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
                    <label className="w-16 h-16 border border-dashed border-stone-800 hover:border-stone-700 bg-stone-950 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:text-stone-300 transition-all cursor-pointer select-none">
                      <Upload className="w-4 h-4 mb-1 text-stone-400" />
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
        <div className="border-t border-stone-800 bg-stone-950 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Trở Lại
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all tracking-wide cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Đang gửi..." : "Hoàn Tất Đánh Giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

