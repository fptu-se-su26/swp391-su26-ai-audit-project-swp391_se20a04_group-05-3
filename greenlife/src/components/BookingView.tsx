import React, { useState, useMemo } from "react";
import { Calendar, UserCheck, ShieldCheck, DollarSign, Clock, CheckCircle2, ChevronRight, Video, MapPin, Award } from "lucide-react";
import { Appointment } from "../types";
import { EXPERTS } from "../data";
import { useAppContext } from "../context/AppContext";
import { LocationSelector } from "./ui/LocationSelector";

interface BookingViewProps {
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  appointments,
  onAddAppointment,
}) => {
  const { userLocation, selectedStoreId, setSelectedStoreId, stores } = useAppContext();
  const [selectedExpertId, setSelectedExpertId] = useState(EXPERTS[0].id);
  const [date, setDate] = useState("2026-05-28");
  const [timeSlot, setTimeSlot] = useState("10:00 - 11:30");
  const [consultType, setConsultType] = useState<"online" | "offline">("online");
  const [userNode, setUserNode] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const matchedExpert = EXPERTS.find((e) => e.id === selectedExpertId) || EXPERTS[0];

  // Price adjustment factor (Offline is slightly costlier due to travel)
  const calculatedPrice = consultType === "offline" ? matchedExpert.price + 150000 : matchedExpert.price;

  const cityStores = useMemo(() => {
    return stores.filter((s) => s.city === userLocation.city);
  }, [stores, userLocation.city]);

  const matchedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const noteDetails = consultType === "offline" 
      ? `Địa chỉ: ${userLocation.address}. Giao hàng điều phối từ: ${matchedStore?.name || "Tự động"}. Ghi chú: ${userNode}`
      : userNode;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      expertName: matchedExpert.name,
      title: matchedExpert.topic,
      date: date,
      time: timeSlot,
      type: consultType,
      price: calculatedPrice,
      status: "confirmed",
      userNotes: noteDetails
    };

    onAddAppointment(newAppointment);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 5000);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Đang chờ";
      case "completed":
        return "Đã hoàn thành";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-12 pb-20 text-stone-100">
      
      {/* Page Header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase font-semibold">KÊNH TƯ VẤN THỰC THỂ</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-100 tracking-tight flex items-center gap-2">
          <Calendar className="h-8 w-8 text-emerald-400" />
          Đặt Lịch Hẹn Với Kỹ Sư Sinh Học
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Đồng hành cùng các Thạc sĩ sinh vật học và Nhà thiết kế phong cảnh có kinh nghiệm lâu năm để quy hoạch ban công, chữa bệnh thực vật diện rộng và chọn phân bón vi sinh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left column - Select Expert details */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="font-display font-semibold text-stone-100 text-sm tracking-widest uppercase">Ban Chuyên Gia GreenLife</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {EXPERTS.map((expert) => (
              <div 
                key={expert.id}
                onClick={() => setSelectedExpertId(expert.id)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all relative ${
                  selectedExpertId === expert.id
                    ? "border-emerald-500 bg-emerald-950/25"
                    : "border-stone-850 bg-stone-900/40 hover:border-stone-800 hover:bg-stone-900"
                }`}
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={expert.avatar}
                    alt={expert.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-semibold text-stone-100 text-sm flex items-center gap-1">
                      {expert.name}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{expert.role}</p>
                    <p className="text-[11px] text-stone-400 mt-2 line-clamp-2 leading-relaxed">{expert.experience}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-850 text-xs font-mono">
                  <span className="text-stone-500">Đặt lịch tham vấn:</span>
                  <span className="text-stone-200 font-semibold">{expert.price.toLocaleString("vi-VN")}₫/h</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-stone-900/10 border border-stone-800 rounded-2xl text-xs text-stone-400 space-y-2.5">
            <h5 className="font-semibold text-stone-200 flex items-center gap-1.5 uppercase font-mono text-[10px]">
              <Award className="h-4 w-4 text-emerald-400" />
              Tại sao bạn nên tham vấn chuyên gia?
            </h5>
            <p className="leading-relaxed">
              Các chuyên gia nông học hỗ trợ giải mã mẫu xét nghiệm vi khuẩn đất, tính toán chu trình hấp thụ quang năng sinh khối căn hộ và xử lý nấm phong lan quý hiếm hiệu quả dứt điểm nhanh.
            </p>
          </div>
        </div>

        {/* Right Column - Booking scheduler form */}
        <div className="lg:col-span-8 bg-stone-950 border border-stone-850 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="border-b border-stone-850 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-stone-100 text-lg">Phiếu Đăng Ký Chẩn Trị Thực Địa</h3>
            <span className="text-xs text-stone-500 font-mono">Hồ sơ: <strong className="text-emerald-400">GreenLife Premium</strong></span>
          </div>

          {/* Booking Success display banner */}
          {successMsg && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <strong className="block font-semibold">Đăng ký thành công!</strong>
                <span>Lịch hẹn của bạn đã được chuyển tới chuyên gia {matchedExpert.name}. Kiểm tra hồ sơ cá nhân để nhận lịch khảo sát.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="space-y-6">
            
            {/* Show Selected Expert details as badge */}
            <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={matchedExpert.avatar}
                  alt={matchedExpert.name}
                  className="w-10 h-10 object-cover rounded-full border border-stone-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs text-stone-400">Đã chọn Chuyên gia:</span>
                  <p className="text-sm font-semibold text-stone-100 leading-normal">{matchedExpert.name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-stone-500 block">Dịch vụ:</span>
                <span className="text-xs text-stone-300 font-medium line-clamp-1">{matchedExpert.topic}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs text-stone-400 font-mono block">Chọn ngày tham vấn:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Time Slot Select */}
              <div className="space-y-2">
                <label className="text-xs text-stone-400 font-mono block">Chọn khung giờ vàng:</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                >
                  <option value="08:30 - 10:00">Buổi sáng: 08:30 - 10:00</option>
                  <option value="10:00 - 11:30">Buổi sáng: 10:00 - 11:30</option>
                  <option value="14:00 - 15:30">Buổi chiều: 14:00 - 15:30</option>
                  <option value="15:30 - 17:00">Buổi chiều: 15:30 - 17:00</option>
                </select>
              </div>
            </div>

            {/* Select Channel Method: Video consultation vs Offline Garden visit */}
            <div className="space-y-2">
              <label className="text-xs text-stone-400 font-mono block font-medium">Hình thức hội chẩn chuyên khoa:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "online", label: "Hội chẩn Trực Tuyến qua Zoom Call", desc: "Tương tác trực quan, gửi ảnh thực địa nhanh", icon: Video },
                  { id: "offline", label: "Khảo Sát Tận Vườn Nhà (+150.000đ)", desc: "Kỹ sư tới đo đất đo hạt đo ánh sáng thực tế", icon: MapPin }
                ].map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div
                      key={channel.id}
                      onClick={() => setConsultType(channel.id as "online" | "offline")}
                      className={`p-4 rounded-xl border cursor-pointer flex gap-3 transition-all ${
                        consultType === channel.id
                          ? "border-emerald-500 bg-emerald-950/25 text-stone-100"
                          : "border-stone-850 bg-stone-900 text-stone-400 hover:text-stone-300"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-semibold">{channel.label}</h5>
                        <p className="text-[10px] text-stone-500 mt-1">{channel.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Map and Location selector for offline garden surveys */}
            {consultType === "offline" && (
              <div className="space-y-5 p-4 bg-stone-900 border border-stone-800 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <h4 className="font-semibold text-xs text-stone-200 uppercase font-mono tracking-wider">
                    Địa chỉ khảo sát thực tế
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Hệ thống sẽ điều phối kỹ sư từ chi nhánh vườn ươm gần bạn nhất để rút ngắn thời gian di chuyển.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LocationSelector />

                  <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-stone-200">Vườn đối tác phụ trách:</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {cityStores.map((store) => {
                        const isSelected = selectedStoreId === store.id;
                        return (
                          <div
                            key={store.id}
                            onClick={() => setSelectedStoreId(store.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                                : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div>
                                <p className="text-xs font-bold text-stone-100">{store.name.replace("Nhà Vườn ", "").replace("Cửa Hàng ", "")}</p>
                                <p className="text-[9px] text-stone-500 mt-0.5 line-clamp-1">{store.address}</p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 ${
                                isSelected
                                  ? "bg-emerald-500 text-black"
                                  : "bg-stone-800 text-stone-400"
                              }`}>
                                {isSelected ? "ĐANG CHỌN" : "CHỌN"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostics details/notes */}
            <div className="space-y-2">
              <label className="text-xs text-stone-400 font-mono block">Mô tả cụ thể lịch sử cây trồng hoặc ban công của bạn:</label>
              <textarea
                value={userNode}
                onChange={(e) => setUserNode(e.target.value)}
                placeholder="Ví dụ: Cây hồng leo của em bị khô nách đã hơn một tuần nay, em xịt xà phòng không bớt rệp..."
                rows={3}
                className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-xs focus:outline-none"
              />
            </div>

            {/* Live calculated Price receipt */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-500 font-mono block">Tổng chi phí dự kiến:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{calculatedPrice.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex items-center gap-1 text-stone-400">
                <Clock className="h-4 w-4 text-stone-500" />
                <span>Thời gian tư vấn: 1.5 giờ</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-sm text-black rounded-xl cursor-pointer transition-all uppercase tracking-tight"
            >
              Gửi Yêu Cầu Đặt Chỗ Ngay
            </button>
          </form>
        </div>
      </div>

      {/* Active appointment history lists */}
      {appointments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-850">
          <h3 className="font-display font-bold text-stone-100 text-lg tracking-tight">Lịch Hẹn Tham Vấn Hiện Tại Của Bạn ({appointments.length})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-stone-950 border border-stone-850 p-5 rounded-2xl text-xs space-y-3"
              >
                <div className="flex justify-between items-center border-b border-stone-850 pb-2">
                  <span className="font-semibold text-stone-200 text-sm line-clamp-1">{apt.expertName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                    apt.status === "confirmed"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-950/70 text-amber-500 border-amber-500/20"
                  }`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>

                <div className="space-y-1 text-stone-400 font-mono text-[11px]">
                  <p>🗓️ Ngày hẹn: <strong className="text-stone-300">{apt.date}</strong></p>
                  <p>🕒 Khung giờ: <strong className="text-stone-300">{apt.time} ({apt.type === "online" ? "Online Zoom" : "Tận Nhà"})</strong></p>
                  <p>🩺 Chuyên đề: <span className="text-stone-300">{apt.title}</span></p>
                  {apt.userNotes && (
                    <p className="text-[10px] text-stone-500 leading-normal mt-2 pt-2 border-t border-stone-900 border-dashed">
                      📝 Chi tiết: {apt.userNotes}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-850 text-[10px] text-stone-500">
                  <span>Trực phòng đại diện</span>
                  <span className="text-emerald-400 font-medium font-mono font-bold">{apt.price.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
