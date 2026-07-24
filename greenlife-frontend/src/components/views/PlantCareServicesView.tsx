import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MapPin, Phone, MessageCircle, Sparkles, Clock, DollarSign, Calendar, X, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { PlantCareServiceAPI } from "../../services/plantCareService";
import { BookingService } from "../../services/bookingService";
import { PlantCareService } from "../../types";
import { getTelUrl, getZaloContactUrl, copyPhoneToClipboard } from "../../utils/contactLinks";
import toast from "react-hot-toast";
import AdministrativeService, { AdministrativeProvinceDTO, AdministrativeCommuneDTO } from "../../services/administrativeService";

export const PlantCareServicesView: React.FC = () => {
  const { currentUser, setCurrentPage, userLocation } = useAppContext();

  // Search & Filter state
  const [keyword, setKeyword] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  
  const [provincesList, setProvincesList] = useState<AdministrativeProvinceDTO[]>([]);
  const [communesList, setCommunesList] = useState<AdministrativeCommuneDTO[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        const data = await AdministrativeService.getProvinces();
        if (isMounted) setProvincesList(data);
      } catch (err) {
        // Silently handled
      }
    };
    fetchProvinces();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedCity !== "Tất cả" && provincesList.length > 0) {
      const prov = provincesList.find(p => p.name === selectedCity);
      if (prov) {
        AdministrativeService.getCommunesByProvince(prov.id).then(communes => {
          if (isMounted) setCommunesList(communes);
        });
      }
    } else {
      setCommunesList([]);
    }
    return () => { isMounted = false; };
  }, [selectedCity, provincesList]);

  // Data loading state
  const [services, setServices] = useState<PlantCareService[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Booking Modal State
  const [activeService, setActiveService] = useState<PlantCareService | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [customerAddress, setCustomerAddress] = useState(userLocation.address || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch active services
  const fetchServices = useCallback(async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const cityFilter = selectedCity === "Tất cả" ? undefined : selectedCity;
      const districtFilter = selectedDistrict === "Tất cả" ? undefined : selectedDistrict;
      const minPriceFilter = minPrice ? Number(minPrice) : undefined;
      const maxPriceFilter = maxPrice ? Number(maxPrice) : undefined;

      const response = await PlantCareServiceAPI.getServices({
        keyword: keyword.trim() || undefined,
        city: cityFilter,
        district: districtFilter,
        minPrice: minPriceFilter,
        maxPrice: maxPriceFilter,
        page: pageNum,
        size: 9
      });

      setServices(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setPage(pageNum);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách dịch vụ chăm sóc.");
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCity, selectedDistrict, minPrice, maxPrice]);

  useEffect(() => {
    fetchServices(0);
  }, [selectedCity, selectedDistrict, minPrice, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices(0);
  };

  // Reset district if city changes
  useEffect(() => {
    setSelectedDistrict("Tất cả");
  }, [selectedCity]);

  // Handle open booking modal
  const handleOpenBooking = (service: PlantCareService) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thực hiện đặt lịch dịch vụ.");
      setCurrentPage("auth");
      return;
    }
    setActiveService(service);
    setBookingDate("");
    setBookingTime("");
    setCustomerAddress(userLocation.address || "");
    setCustomerPhone("");
    setCustomerNote("");
    setIssueDescription("");
    setBookingError(null);
  };

  // Handle submit booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!activeService) return;

    // Validate inputs
    const trimmedAddress = customerAddress.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedNote = customerNote.trim();
    const trimmedIssue = issueDescription.trim();

    if (!bookingDate || !bookingTime) {
      setBookingError("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }
    if (!trimmedAddress) {
      setBookingError("Vui lòng nhập địa chỉ thực hiện dịch vụ.");
      return;
    }
    if (!trimmedIssue) {
      setBookingError("Mô tả tình trạng cây trồng cần chăm sóc là bắt buộc.");
      return;
    }
    if (trimmedPhone.length > 20) {
      setBookingError("Số điện thoại không được vượt quá 20 ký tự.");
      return;
    }
    if (trimmedNote.length > 500) {
      setBookingError("Ghi chú không được vượt quá 500 ký tự.");
      return;
    }
    if (trimmedIssue.length > 500) {
      setBookingError("Mô tả tình trạng không được vượt quá 500 ký tự.");
      return;
    }

    // Validate time (at least 2 hours in the future)
    const scheduledDateTimeStr = `${bookingDate}T${bookingTime}:00`;
    const scheduledDate = new Date(scheduledDateTimeStr);
    const minAllowedDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    if (isNaN(scheduledDate.getTime())) {
      setBookingError("Định dạng thời gian không hợp lệ.");
      return;
    }
    if (scheduledDate < minAllowedDate) {
      setBookingError("Thời gian hẹn phải cách thời điểm hiện tại ít nhất 2 giờ.");
      return;
    }

    setSubmittingBooking(true);
    try {
      await BookingService.createBooking({
        serviceId: activeService.id,
        scheduledAt: scheduledDateTimeStr,
        serviceAddress: trimmedAddress,
        customerAddress: trimmedAddress,
        customerPhone: trimmedPhone || undefined,
        customerNote: trimmedNote || undefined,
        issueDescription: trimmedIssue
      } as any);

      toast.success("Đặt lịch chăm sóc cây thành công! 🌱");
      setActiveService(null);
    } catch (err: any) {
      const errMsg = err.message || "Đã xảy ra lỗi khi đăng ký đặt lịch.";
      setBookingError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-12 pb-20 text-[var(--gl-text-primary)] animate-fadeIn">
      {/* Page Header */}
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs text-[var(--gl-accent)] font-mono tracking-widest uppercase font-semibold">
          Dịch Vụ Chăm Sóc Cây Trồng Chuyên Nghiệp
        </span>
        <h1 className="text-3xl sm:text-4.5xl font-display font-extrabold text-[var(--gl-text-primary)] tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <Sparkles className="h-8 w-8 text-[var(--gl-accent)] animate-pulse" />
          Dịch vụ chăm sóc cây GreenLife
        </h1>
        <p className="text-[var(--gl-text-secondary)] text-sm max-w-3xl leading-relaxed">
          Tìm kiếm và đặt lịch các dịch vụ chăm sóc cây cảnh, cắt tỉa cành nghệ thuật, quy hoạch ban công và cải tạo đất hữu cơ trực tiếp từ các đối tác nhà vườn uy tín của GreenLife.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl shadow-xl backdrop-blur-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[var(--gl-text-muted)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm dịch vụ theo tên, mô tả..."
              className="w-full min-h-[40px] bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] rounded-2xl py-3 pl-12 pr-4 text-xs sm:text-sm focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] transition-all"
            />
          </div>
          
          <button
            type="submit"
            className="px-6 py-3 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* City / Province Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">Tỉnh / Thành phố</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] cursor-pointer font-medium"
            >
              <option value="Tất cả" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Tất cả tỉnh thành</option>
              {provincesList.map((p) => (
                <option key={p.id} value={p.name} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{p.name}</option>
              ))}
            </select>
          </div>

          {/* Commune / Ward Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">Xã / Phường / Đặc khu</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedCity === "Tất cả"}
              className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] disabled:opacity-50 cursor-pointer font-medium"
            >
              <option value="Tất cả" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Tất cả xã phường</option>
              {communesList.map((c) => (
                <option key={c.code} value={c.displayName} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{c.displayName}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">Giá tối thiểu (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 100000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] font-medium"
            />
          </div>

          {/* Max Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">Giá tối đa (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 2000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] font-medium"
            />
          </div>
        </div>
      </div>

      {/* Services Listing */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl space-y-4 shadow-sm">
          <div className="text-4xl">🌱</div>
          <h3 className="text-sm font-semibold text-[var(--gl-text-primary)]">Không tìm thấy dịch vụ phù hợp</h3>
          <p className="text-xs text-[var(--gl-text-muted)] max-w-md mx-auto leading-relaxed">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng giá để kết nối với các đối tác của GreenLife.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="gl-border-beam group bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Service Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[8px] bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 font-mono font-bold uppercase tracking-wide">
                        {service.storeName}
                      </span>
                      <h3 className="font-bold text-[var(--gl-text-primary)] text-base group-hover:text-[var(--gl-accent)] transition-colors duration-200 line-clamp-1">
                        {service.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed line-clamp-3 h-14">
                    {service.description}
                  </p>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-[var(--gl-border)] text-[11px] font-mono text-[var(--gl-text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--gl-accent)] shrink-0" />
                      <span>{service.durationMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--gl-accent)] shrink-0" />
                      <span className="font-bold text-[var(--gl-accent)]">{service.price.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>

                  {/* Store Address & Location */}
                  <div className="space-y-1 text-[11px] text-[var(--gl-text-secondary)] pt-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--gl-text-muted)] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{service.storeAddress}, {service.storeDistrict}, {service.storeCity}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Grid */}
                <div className="pt-6 border-t border-[var(--gl-border)] mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getTelUrl(service.storePhone)}
                      className="py-2.5 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      <Phone className="h-3.5 w-3.5 text-[var(--gl-accent)] shrink-0" />
                      Gọi điện
                    </a>
                    <a
                      href={getZaloContactUrl(service.storePhone)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                      Zalo
                    </a>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(service)}
                    className="w-full min-h-[44px] py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    Đặt lịch dịch vụ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => fetchServices(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 min-h-[36px] bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-xs rounded-xl disabled:opacity-50 text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Trước
              </button>
              <span className="text-xs text-[var(--gl-text-muted)] font-mono">Trang {page + 1} / {totalPages}</span>
              <button
                type="button"
                onClick={() => fetchServices(page + 1)}
                disabled={page === totalPages - 1}
                className="px-4 py-2 min-h-[36px] bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-xs rounded-xl disabled:opacity-50 text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Form Modal */}
      {activeService && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="relative h-24 bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] flex items-center px-6">
              <div>
                <span className="text-[10px] text-[var(--gl-accent)] font-mono tracking-widest uppercase block font-bold">
                  Đăng ký đặt lịch hẹn
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[var(--gl-text-primary)] flex items-center gap-1.5 mt-0.5 line-clamp-1">
                  {activeService.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="absolute top-6 right-6 rounded-xl p-2 bg-[var(--gl-bg-surface)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {bookingError && (
                <div className="p-3 bg-rose-500/10 text-[var(--gl-danger)] border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Service details summary */}
              <div className="bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--gl-text-secondary)] font-medium">Đơn vị cung cấp:</span>
                  <span className="font-bold text-[var(--gl-text-primary)]">{activeService.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gl-text-secondary)] font-medium">Thời lượng dự kiến:</span>
                  <span className="font-bold text-[var(--gl-text-primary)]">{activeService.durationMinutes} phút</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gl-text-secondary)] font-medium">Đơn giá khảo sát:</span>
                  <span className="font-bold text-[var(--gl-accent)]">{activeService.price.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>

              {/* Date & Time Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                    Chọn ngày hẹn *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                    Chọn giờ hẹn *
                  </label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] font-medium"
                    required
                  />
                </div>
              </div>

              {/* Service Address (Required) */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                  Địa chỉ thực hiện dịch vụ *
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, quận/huyện, thành phố..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] font-medium"
                  required
                />
              </div>

              {/* Contact Phone (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                  Số điện thoại liên hệ (Để trống nếu dùng SĐT tài khoản)
                </label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại liên lạc khi làm dịch vụ..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  maxLength={20}
                  className="w-full text-xs min-h-[40px] p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] font-medium"
                />
              </div>

              {/* Issue Description (Required / Strongly Enforced) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                    Mô tả chi tiết yêu cầu / tình trạng cây trồng *
                  </label>
                  <span className="text-[9px] text-[var(--gl-text-muted)] font-mono">
                    {issueDescription.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  placeholder="Vui lòng nêu rõ loại cây, số lượng, biểu hiện bệnh hại (nếu có) hoặc kích thước ban công cần thi công khảo sát..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  maxLength={500}
                  className="w-full text-xs p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] h-20 resize-none font-medium"
                  required
                />
              </div>

              {/* Customer Note (Optional) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-[var(--gl-text-secondary)] uppercase font-mono tracking-wider block font-semibold">
                    Ghi chú thêm cho nhân viên kỹ thuật
                  </label>
                  <span className="text-[9px] text-[var(--gl-text-muted)] font-mono">
                    {customerNote.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  placeholder="Ghi chú thêm về thời gian rảnh, lưu ý về bãi gửi xe, thú cưng..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  maxLength={500}
                  className="w-full text-xs p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] h-16 resize-none font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--gl-border)]">
                <button
                  type="button"
                  onClick={() => setActiveService(null)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="flex-1 min-h-[44px] px-5 py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] disabled:opacity-50 text-white dark:text-emerald-950 text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] shadow-sm"
                >
                  {submittingBooking ? "Đang gửi đăng ký..." : "Gửi yêu cầu đặt lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
