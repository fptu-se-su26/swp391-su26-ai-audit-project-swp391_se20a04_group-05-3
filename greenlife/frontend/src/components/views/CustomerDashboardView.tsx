import React from "react";
import { User, ShoppingBag, Activity, Calendar, MapPin, Mail, Shield, Edit } from "lucide-react";
// ... existing imports remain unchanged
import { Appointment, DiagnosisLog } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { UserService } from "../../services/userService";


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
  const { currentUser, userLocation, stores, updateCurrentUser } = useAppContext();

  const handleEditName = async () => {
    const newName = window.prompt("Nhập tên mới:", currentUser?.name || "");
    if (newName && newName.trim() && currentUser) {
      const res = await UserService.updateUser(currentUser.id, { name: newName.trim() });
      if (res.success) {
        updateCurrentUser({ ...currentUser, name: newName.trim() });
      } else {
        alert("Cập nhật tên thất bại.");
      }
    }
  };

  // Mock Customer Orders for Nguyễn Hoàng Long
  const myOrders = [
    { id: "GL-8391", date: "2026-05-22", total: 250000, status: "shipped", itemsCount: 2, items: "Cây sen đá ngọc, Phân trùn quế organic" },
    { id: "GL-8390", date: "2026-05-15", total: 450000, status: "completed", itemsCount: 3, items: "Dầu neem sinh học, Đất trồng vi sinh, Chậu gốm mộc" }
  ];

  const cityStores = stores.filter((s) => s.city === userLocation.city);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "shipped":
        return "Đang vận chuyển";
      case "completed":
        return "Đã hoàn thành";
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
              ⭐ TÀI KHOẢN KHÁCH HÀNG
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1.5">
                {currentUser?.name || "Nguyễn Hoàng Long"}
                <button onClick={handleEditName} className="ml-2 inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline" aria-label="Chỉnh sửa tên">
                  <Edit className="h-4 w-4" />
                </button>
            </h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">ID: GL-CUST-{currentUser?.id.slice(-6).toUpperCase() || "83921"}</p>
          </div>
        </div>

        <div className="flex gap-4 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 pt-4 md:pt-0 md:pl-8 text-center md:text-left">
          <div>
            <span className="text-[10px] text-stone-400 font-mono block">Ngày tham gia:</span>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 block mt-1">
              {currentUser?.registeredDate || "2025-01-10"}
            </span>
            <span className="text-[10px] text-stone-500">Đã kích hoạt bảo vệ mầm xanh</span>
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
                  Khách hàng
                </span>
              </div>
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
          
          {/* My Orders */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Đơn Hàng Của Tôi
            </h3>

            <div className="space-y-3">
              {myOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-stone-100 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-850 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
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
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold font-mono text-center self-start sm:self-center ${getStatusColor(ord.status)}`}>
                    {getStatusLabel(ord.status)}
                  </span>
                </div>
              ))}
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

    </div>
  );
};
