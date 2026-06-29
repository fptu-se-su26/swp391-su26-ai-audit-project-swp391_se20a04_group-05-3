import React, { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Phone, MessageCircle, User, X, Facebook, Mail, Sparkles, ArrowRight } from "lucide-react";
import { EXPERTS } from "../../data";
import { Expert } from "../../types";
import { BookingService } from "../../services/bookingService";
import { HttpClient } from "../../services/httpClient";

// 1. ĐỊNH NGHĨA DỮ LIỆU MẪU (TypeScript Interface - Đã có trong types.ts, định nghĩa lại/re-export để đồng bộ)
export interface ExpertDirectoryProps {
  onBackToHome?: () => void;
}

export const ExpertDirectoryView: React.FC<ExpertDirectoryProps> = ({ onBackToHome }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [activeExpert, setActiveExpert] = useState<Expert | null>(null);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeExpert) {
      setShowBookingForm(false);
      return;
    }
    const controller = new AbortController();
    const fetchServices = async () => {
      setLoadingServices(true);
      setServicesError(null);
      try {
        const data = await HttpClient.get("/api/services?page=0&size=50", {
          signal: controller.signal
        });
        const content = data.content || [];
        setServices(content);
        if (content.length > 0) {
          setSelectedServiceId(String(content[0].id));
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setServicesError(err.message || "Lỗi tải dịch vụ");
        }
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
    return () => controller.abort();
  }, [activeExpert]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedServiceId) {
      setBookingError("Vui lòng chọn dịch vụ.");
      return;
    }
    if (!bookingDate || !bookingTime) {
      setBookingError("Vui lòng chọn đầy đủ ngày và giờ.");
      return;
    }
    if (!serviceAddress.trim()) {
      setBookingError("Địa chỉ dịch vụ không được để trống.");
      return;
    }
    if (customerNote.length > 500) {
      setBookingError("Ghi chú không được vượt quá 500 ký tự.");
      return;
    }

    const scheduledDateTimeStr = `${bookingDate}T${bookingTime}:00`;
    const scheduledDate = new Date(scheduledDateTimeStr);
    const minAllowedDate = new Date(Date.now() + 2 * 60 * 65 * 1000); // 2 hours
    if (scheduledDate < minAllowedDate) {
      setBookingError("Thời gian đặt hẹn phải cách thời điểm hiện tại ít nhất 2 giờ.");
      return;
    }

    setSubmittingBooking(true);
    try {
      await BookingService.createBooking({
        serviceId: Number(selectedServiceId),
        scheduledAt: scheduledDateTimeStr,
        serviceAddress: serviceAddress.trim(),
        customerNote: customerNote.trim()
      });
      setBookingSuccess(true);
      setBookingDate("");
      setBookingTime("");
      setServiceAddress("");
      setCustomerNote("");
      setTimeout(() => {
        setBookingSuccess(false);
        setShowBookingForm(false);
        setActiveExpert(null);
      }, 2500);
    } catch (err: any) {
      setBookingError(err.message || "Đã xảy ra lỗi khi tạo lịch hẹn.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Lấy danh sách các khu vực độc nhất từ dữ liệu chuyên gia để làm bộ lọc nhanh
  const locations = useMemo(() => {
    const locSet = new Set(EXPERTS.map((e) => e.location));
    return ["all", ...Array.from(locSet)];
  }, []);

  // Lọc chuyên gia theo tìm kiếm tên/chuyên môn và khu vực
  const filteredExperts = useMemo(() => {
    return EXPERTS.filter((expert) => {
      const matchesSearch =
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        expert.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        selectedLocation === "all" || expert.location === selectedLocation;

      return matchesSearch && matchesLocation;
    });
  }, [searchQuery, selectedLocation]);

  return (
    <div className="space-y-12 pb-20 text-stone-100 animate-fadeIn">
      {/* Page Header */}
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase font-semibold">
          Kết Nối Trực Tiếp Chuyên Gia Sinh Học
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-display font-extrabold text-stone-100 tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
          Danh Bạ Chuyên Gia GreenLife
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Tra cứu nhanh và liên hệ trực tiếp với các Kỹ sư Nông nghiệp, Thạc sĩ Công nghệ sinh học hàng đầu của GreenLife. Tư vấn thực địa, chẩn trị dịch hại cây cảnh và quy hoạch cảnh quan Eco-Luxury.
        </p>
      </div>

      {/* Search Bar & Location Filter Grid */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-stone-950/80 border border-stone-850 p-5 rounded-3xl shadow-xl backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chuyên gia theo tên hoặc chuyên môn (ví dụ: trị bệnh rễ, ban công...)"
            className="w-full bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-500 rounded-2xl py-3 pl-12 pr-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-stone-400 font-mono shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Khu vực:
          </span>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border shrink-0 ${
                selectedLocation === loc
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
              }`}
            >
              {loc === "all" ? "Tất cả" : loc}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Expert Cards */}
      {filteredExperts.length === 0 ? (
        <div className="text-center py-20 bg-stone-950/20 border border-stone-850/50 rounded-3xl space-y-4">
          <div className="text-4xl">🔍</div>
          <h3 className="text-sm font-semibold text-stone-300">Không tìm thấy chuyên gia phù hợp</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khu vực khác để kết nối với đội ngũ GreenLife.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="group bg-stone-900/40 hover:bg-stone-900/70 border border-stone-850 hover:border-emerald-500/30 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl relative overflow-hidden"
            >
              {/* Luxury Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Profile Header */}
                <div className="flex gap-4 items-start">
                  <div className="relative shrink-0">
                    <img
                      src={expert.avatar}
                      alt={expert.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-800 group-hover:border-emerald-500/45 transition-colors duration-300 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-black px-1.5 py-0.5 rounded-md text-[8px] font-mono font-extrabold uppercase tracking-wide flex items-center gap-0.5 border border-stone-900">
                      Active
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-100 text-base group-hover:text-emerald-400 transition-colors duration-200">
                      {expert.name}
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-mono font-medium mt-0.5 leading-snug">
                      {expert.title}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-2 font-mono">
                      <MapPin className="h-3 w-3 text-stone-500 shrink-0" />
                      <span>{expert.location}</span>
                    </div>
                  </div>
                </div>

                {/* Bio Description */}
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                  {expert.bio}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {expert.specialty.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/20 text-emerald-400 font-mono text-[9px] font-medium transition-colors group-hover:border-emerald-800/30"
                    >
                      #{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-stone-850 mt-6">
                <button
                  onClick={() => setActiveExpert(expert)}
                  className="w-full py-3 bg-stone-950 hover:bg-emerald-500 border border-stone-800 hover:border-emerald-400 text-stone-300 hover:text-black font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow"
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  Liên hệ ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hộp Thoại Thông Tin Liên Hệ (Contact Modal/Pop-up) */}
      {activeExpert && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-850 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Header / Background Card */}
            <div className="relative h-24 bg-gradient-to-r from-emerald-950 to-stone-900 border-b border-stone-850/80 flex items-center px-6">
              <h2 className="text-sm font-semibold text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Hồ Sơ Chuyên Gia
              </h2>
              <button
                onClick={() => setActiveExpert(null)}
                className="absolute top-4 right-4 rounded-xl p-2 bg-stone-950/60 hover:bg-stone-950 border border-stone-800 text-stone-400 hover:text-white transition-all cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Detail Content */}
            <div className="p-6 space-y-6">
              {/* Profile Image & Meta */}
              <div className="flex gap-4 items-center -mt-12 relative z-10">
                <img
                  src={activeExpert.avatar}
                  alt={activeExpert.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-stone-900 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="pt-6">
                  <h3 className="font-bold text-stone-100 text-lg leading-tight">
                    {activeExpert.name}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-mono mt-1 leading-snug">
                    {activeExpert.title}
                  </p>
                </div>
              </div>

              {/* Bio details */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">
                  Kinh nghiệm & Giới thiệu
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/45 p-4 rounded-2xl border border-stone-850">
                  {activeExpert.bio}
                </p>
              </div>

              {/* Specialties Tag Group */}
              <div className="space-y-2">
                <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">
                  Mảng hỗ trợ chính
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeExpert.specialty.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/10 text-emerald-400 font-mono text-[9px]"
                    >
                      #{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle Booking Form / Contact Info */}
              <div className="pt-2">
                <button
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl transition-all text-xs shadow-sm hover:shadow cursor-pointer"
                >
                  {showBookingForm ? "Xem thông tin liên hệ trực tiếp 📞" : "Đặt lịch dịch vụ khảo sát chuyên gia 🌿"}
                </button>
              </div>

              {showBookingForm ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-stone-850">
                  <h4 className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">
                    Đăng ký dịch vụ khảo sát
                  </h4>

                  {bookingSuccess && (
                    <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded-xl text-xs font-medium text-center">
                      Đặt lịch khảo sát thành công! Hệ thống đang xử lý và chuyển hướng...
                    </div>
                  )}

                  {bookingError && (
                    <div className="p-3 bg-red-950/20 text-red-400 border border-red-900/30 rounded-xl text-xs font-medium text-center">
                      {bookingError}
                    </div>
                  )}

                  {/* Service selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">
                      Chọn gói dịch vụ
                    </label>
                    {loadingServices ? (
                      <div className="h-10 bg-stone-950 border border-stone-800 rounded-xl animate-pulse"></div>
                    ) : servicesError ? (
                      <p className="text-[10px] text-red-450">Không thể tải dịch vụ: {servicesError}</p>
                    ) : services.length === 0 ? (
                      <p className="text-[10px] text-stone-500">Chưa có dịch vụ nào khả dụng trên hệ thống.</p>
                    ) : (
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full text-xs p-3 bg-stone-950 border border-stone-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-stone-200"
                        required
                      >
                        {services.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} ({svc.storeName}) - {svc.price.toLocaleString("vi-VN")}₫
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Date & Time fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">
                        Chọn ngày
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full text-xs p-3 bg-stone-950 border border-stone-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-stone-200"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">
                        Chọn giờ
                      </label>
                      <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full text-xs p-3 bg-stone-950 border border-stone-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-stone-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Service Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">
                      Địa chỉ khảo sát
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập địa chỉ nhà vườn / ban công của bạn..."
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      className="w-full text-xs p-3 bg-stone-950 border border-stone-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-stone-200"
                      required
                    />
                  </div>

                  {/* Customer Note */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">
                        Ghi chú yêu cầu
                      </label>
                      <span className="text-[9px] text-stone-500 font-mono">
                        {customerNote.length}/500 ký tự
                      </span>
                    </div>
                    <textarea
                      placeholder="Ví dụ: Cần thiết kế giàn hoa giấy leo ban công chung cư lầu 15, tưới nước tự động..."
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      maxLength={500}
                      className="w-full text-xs p-3 bg-stone-950 border border-stone-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-stone-200 h-20 resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="px-4 py-2.5 bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBooking || loadingServices || services.length === 0}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {submittingBooking ? "Đang gửi đăng ký..." : "Gửi yêu cầu đặt lịch"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 pt-4 border-t border-stone-850">
                  <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">
                    Phương thức kết nối trực tiếp
                  </span>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Gọi điện */}
                    <a
                      href={`tel:${activeExpert.phone}`}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all text-xs shadow-sm hover:shadow"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>Gọi điện trực tiếp</span>
                      </div>
                      <span className="font-mono text-[11px] tracking-wide bg-black/10 px-2 py-0.5 rounded">
                        {activeExpert.phone}
                      </span>
                    </a>

                    {/* Nhắn Zalo */}
                    <a
                      href={activeExpert.zaloLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-stone-950 hover:bg-stone-850 border border-stone-800 hover:border-stone-750 text-stone-200 font-semibold rounded-xl transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageCircle className="h-4 w-4 text-sky-400 shrink-0" />
                        <span>Nhắn tin qua Zalo</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">Chat Zalo</span>
                    </a>

                    {/* Kết nối Facebook */}
                    <a
                      href={activeExpert.facebookLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-stone-950 hover:bg-stone-850 border border-stone-800 hover:border-stone-750 text-stone-200 font-semibold rounded-xl transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Facebook className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Liên hệ Facebook cá nhân</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">Trang cá nhân</span>
                    </a>

                    {/* Hỗ trợ qua email */}
                    <a
                      href={`mailto:expert-${activeExpert.id}@greenlife.vn?subject=Yêu cầu tham vấn GreenLife`}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-stone-950 hover:bg-stone-850 border border-stone-800 hover:border-stone-750 text-stone-200 font-semibold rounded-xl transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Gửi email yêu cầu</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">Email</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer warning */}
            <div className="bg-stone-950 border-t border-stone-850 px-6 py-3 flex items-center justify-center text-[10px] text-stone-500 font-mono">
              ⚡ Giao dịch tự thương lượng ngoài nền tảng
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// 3. ĐOẠN CODE BONUS: BANNER TÍCH HỢP CHÉO
interface ExpertCalloutBannerProps {
  onNavigateToDirectory: () => void;
}

export const ExpertCalloutBanner: React.FC<ExpertCalloutBannerProps> = ({ onNavigateToDirectory }) => {
  return (
    <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 to-stone-900 border border-emerald-500/25 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
      {/* Decorative blurred backdrop glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl" />

      <div className="space-y-2 text-center md:text-left relative z-10 max-w-xl">
        <span className="inline-flex gap-1.5 items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold tracking-wider uppercase border border-emerald-500/20">
          Khảo sát tại nhà
        </span>
        <h4 className="font-display font-bold text-stone-100 text-sm sm:text-base tracking-tight leading-snug">
          Cần hỗ trợ trực tiếp tại nhà?
        </h4>
        <p className="text-stone-400 text-xs leading-relaxed">
          Kết nối ngay với các Chuyên gia nông nghiệp hàng đầu của GreenLife để được khảo sát thực tế, đo đạc chỉ số đất, ánh sáng và lên phương án cải tạo tối ưu.
        </p>
      </div>

      <button
        onClick={onNavigateToDirectory}
        className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-2xl cursor-pointer transition-all flex items-center gap-1.5 uppercase font-mono tracking-wider shrink-0 shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 duration-200 relative z-10"
      >
        <span>Kết nối ngay</span>
        <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};
