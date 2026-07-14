import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, ToggleLeft, ToggleRight, Calendar, Phone, MessageSquare, Clipboard, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { PlantCareService, Appointment } from "../../types";
import { PlantCareServiceAPI } from "../../services/plantCareService";
import { BookingService } from "../../services/bookingService";
import { getTelUrl, getZaloContactUrl, copyPhoneToClipboard } from "../../utils/contactLinks";

interface StoreServicesManagementProps {
  storeId?: number;
}

export const StoreServicesManagement: React.FC<StoreServicesManagementProps> = ({ storeId }) => {
  // Lists and Meta States
  const [services, setServices] = useState<PlantCareService[]>([]);
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [servicesPage, setServicesPage] = useState(0);
  const [servicesTotalPages, setServicesTotalPages] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);

  // Loading and Error States
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [bookingsError, setBookingsError] = useState("");

  // Operation Locks
  const [savingService, setSavingService] = useState(false);
  const [updatingServiceStatusId, setUpdatingServiceStatusId] = useState<number | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Add/Edit Service Modal Form States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<PlantCareService | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formValidationError, setFormValidationError] = useState("");

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingItem, setCancelBookingItem] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonValidationError, setCancelReasonValidationError] = useState("");

  // API Call: Fetch Services
  const fetchServices = useCallback(
    async (page = servicesPage, signal?: AbortSignal) => {
      if (storeId === undefined) return;
      setLoadingServices(true);
      setServicesError("");
      try {
        const res = await PlantCareServiceAPI.getStoreOwnerServices(storeId, page, 5, signal);
        setServices(res.content);
        setServicesTotalPages(res.totalPages);
        setServicesPage(res.page);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setServicesError("Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
        }
      } finally {
        setLoadingServices(false);
      }
    },
    [storeId, servicesPage]
  );

  // API Call: Fetch Bookings
  const fetchBookings = useCallback(
    async (page = bookingsPage, signal?: AbortSignal) => {
      if (storeId === undefined) return;
      setLoadingBookings(true);
      setBookingsError("");
      try {
        const res = await BookingService.getStoreBookings(storeId, page, 5, signal);
        setBookings(res.content);
        setBookingsTotalPages(res.totalPages);
        setBookingsPage(res.page);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setBookingsError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại.");
        }
      } finally {
        setLoadingBookings(false);
      }
    },
    [storeId, bookingsPage]
  );

  // Initial Fetches on Mount & storeId change
  useEffect(() => {
    const controller = new AbortController();
    fetchServices(0, controller.signal);
    fetchBookings(0, controller.signal);
    return () => controller.abort();
  }, [storeId]);

  // Handle Form Open for Create
  const handleOpenCreateModal = () => {
    setSelectedService(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("0");
    setFormDuration("60");
    setFormValidationError("");
    setShowServiceModal(true);
  };

  // Handle Form Open for Edit
  const handleOpenEditModal = (service: PlantCareService) => {
    setSelectedService(service);
    setFormName(service.name);
    setFormDescription(service.description || "");
    setFormPrice(String(service.price));
    setFormDuration(String(service.durationMinutes));
    setFormValidationError("");
    setShowServiceModal(true);
  };

  // Validate and Submit Service Form
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeId === undefined) return;

    const trimmedName = formName.trim();
    const trimmedDesc = formDescription.trim();
    const parsedPrice = Number(formPrice);
    const parsedDuration = Number(formDuration);

    // DTO Validation Alignment
    if (!trimmedName) {
      setFormValidationError("Tên dịch vụ không được để trống.");
      return;
    }
    if (trimmedName.length > 150) {
      setFormValidationError("Tên dịch vụ không được vượt quá 150 ký tự.");
      return;
    }
    if (trimmedDesc.length > 1000) {
      setFormValidationError("Mô tả không được vượt quá 1000 ký tự.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormValidationError("Giá dịch vụ phải lớn hơn hoặc bằng 0.");
      return;
    }
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      setFormValidationError("Thời lượng dịch vụ phải lớn hơn 0.");
      return;
    }

    setSavingService(true);
    setFormValidationError("");
    try {
      const payload = {
        storeId,
        name: trimmedName,
        description: trimmedDesc || undefined,
        price: parsedPrice,
        durationMinutes: parsedDuration
      };

      if (selectedService) {
        await PlantCareServiceAPI.updateService(selectedService.id, payload);
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        await PlantCareServiceAPI.createService(payload);
        toast.success("Tạo dịch vụ mới thành công!");
      }

      setShowServiceModal(false);
      fetchServices(servicesPage);
    } catch (err: any) {
      setFormValidationError(err.message || "Đã xảy ra lỗi khi lưu thông tin dịch vụ.");
    } finally {
      setSavingService(false);
    }
  };

  // Toggle Service Status
  const handleToggleServiceStatus = async (service: PlantCareService) => {
    const nextStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setUpdatingServiceStatusId(service.id);
    try {
      await PlantCareServiceAPI.updateServiceStatus(service.id, nextStatus);
      toast.success(`Đã đổi trạng thái dịch vụ sang: ${nextStatus === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng"}`);
      
      // Local optimistic-like state update
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, status: nextStatus } : s))
      );
    } catch (err: any) {
      toast.error("Không thể thay đổi trạng thái: " + (err.message || err));
    } finally {
      setUpdatingServiceStatusId(null);
    }
  };

  // Booking Forward Status Update Flow
  const handleUpdateBookingStatus = async (booking: Appointment, targetStatus: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED") => {
    setUpdatingBookingId(booking.id);
    try {
      await BookingService.updateBookingStatus(booking.id, targetStatus);
      toast.success("Cập nhật trạng thái lịch hẹn thành công!");
      fetchBookings(bookingsPage);
    } catch (err: any) {
      toast.error("Không thể cập nhật lịch hẹn: " + (err.message || err));
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Cancel Modal Open
  const handleOpenCancelModal = (booking: Appointment) => {
    setCancelBookingItem(booking);
    setCancelReason("");
    setCancelReasonValidationError("");
    setShowCancelModal(true);
  };

  // Validate and Submit Booking Cancellation
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingItem) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelReasonValidationError("Lý do hủy lịch hẹn không được để trống.");
      return;
    }
    if (trimmedReason.length > 500) {
      setCancelReasonValidationError("Lý do hủy không được vượt quá 500 ký tự.");
      return;
    }

    setCancellingBooking(true);
    setCancelReasonValidationError("");
    try {
      await BookingService.cancelBooking(cancelBookingItem.id, trimmedReason);
      toast.success("Đã hủy lịch hẹn thành công.");
      setShowCancelModal(false);
      fetchBookings(bookingsPage);
    } catch (err: any) {
      setCancelReasonValidationError(err.message || "Đã xảy ra lỗi khi hủy lịch hẹn.");
    } finally {
      setCancellingBooking(false);
    }
  };

  // Format Helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "in_progress":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      default:
        return "bg-stone-500/10 text-stone-500 border border-stone-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "in_progress":
        return "Đang thực hiện";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (storeId === undefined) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-stone-900 border border-stone-800 rounded-3xl space-y-4 my-12 text-xs">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <p className="text-stone-300 font-semibold text-sm">Hồ sơ cửa hàng không khả dụng.</p>
        <p className="text-stone-500 text-xs px-6">Vui lòng đăng ký/xác minh thông tin đối tác trước khi quản lý dịch vụ.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* SECTION 1: SERVICES MANAGEMENT */}
      <section className="bg-stone-950/40 border border-stone-200/50 dark:border-stone-850/40 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Danh Sách Dịch Vụ Chăm Sóc Cây
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Niêm yết các gói dịch vụ chăm sóc tại nhà hoặc tham vấn trực tiếp của nhà vườn.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm Dịch Vụ Mới
          </button>
        </div>

        {/* Loading / Error / Empty States */}
        {loadingServices ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : servicesError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs flex items-center justify-between">
            <span>{servicesError}</span>
            <button
              onClick={() => fetchServices(servicesPage)}
              className="flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-2xl text-xs">
            Bạn chưa đăng dịch vụ chăm sóc cây nào. Nhấp vào "Thêm Dịch Vụ Mới" để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-5 bg-stone-900/60 border border-stone-800 hover:border-emerald-500/30 rounded-2xl space-y-3 transition-all relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-stone-100">{service.name}</h3>
                      <p className="text-stone-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {service.description || "Chưa có mô tả dịch vụ."}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        service.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-stone-500/10 text-stone-400 border border-stone-800"
                      }`}
                    >
                      {service.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-850 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-stone-500 text-[10px] block font-mono">ĐƠN GIÁ / THỜI LƯỢNG</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">{formatPrice(service.price)}</span>
                        <span className="text-stone-400 text-[10px] bg-stone-800 px-1.5 py-0.5 rounded-sm">
                          {service.durationMinutes} phút
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleServiceStatus(service)}
                        disabled={updatingServiceStatusId === service.id}
                        className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title={service.status === "ACTIVE" ? "Tạm ngưng dịch vụ" : "Kích hoạt dịch vụ"}
                      >
                        {updatingServiceStatusId === service.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                        ) : service.status === "ACTIVE" ? (
                          <ToggleRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-stone-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(service)}
                        className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Chỉnh sửa dịch vụ"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Services Pagination */}
            {servicesTotalPages > 1 && (
              <div className="flex justify-between items-center pt-2 text-xs text-stone-400">
                <span>Trang {servicesPage + 1} / {servicesTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchServices(servicesPage - 1)}
                    disabled={servicesPage === 0}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => fetchServices(servicesPage + 1)}
                    disabled={servicesPage >= servicesTotalPages - 1}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: BOOKINGS MANAGEMENT */}
      <section className="bg-stone-950/40 border border-stone-200/50 dark:border-stone-850/40 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-6">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            Lịch Hẹn Dịch Vụ Khách Hàng
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Theo dõi, xác nhận và cập nhật tiến độ công việc chăm sóc cây từ các yêu cầu đặt lịch của khách hàng.
          </p>
        </div>

        {/* Loading / Error / Empty States */}
        {loadingBookings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : bookingsError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs flex items-center justify-between">
            <span>{bookingsError}</span>
            <button
              onClick={() => fetchBookings(bookingsPage)}
              className="flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-2xl text-xs">
            Hiện tại cửa hàng không có lịch hẹn dịch vụ nào.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 bg-stone-900/60 border border-stone-850 hover:border-stone-800 rounded-2xl space-y-4 transition-all"
                >
                  {/* Top line Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-850">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-stone-400">Mã lịch hẹn:</span>
                      <strong className="text-xs text-emerald-500 font-mono">#{booking.id}</strong>
                      <span className="text-stone-600">|</span>
                      <span className="text-xs text-stone-300 font-bold">{booking.title}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  {/* Booking details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-stone-300">
                    <div>
                      <span className="text-stone-500 text-[10px] block font-mono uppercase">Khách hàng</span>
                      <span className="font-semibold">{booking.customerName || "Không có tên"}</span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-mono uppercase">Lịch hẹn</span>
                      <span className="font-semibold text-emerald-450">{booking.date} lúc {booking.time}</span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-mono uppercase">Đơn giá dịch vụ</span>
                      <span className="font-semibold text-amber-500">{formatPrice(booking.price)}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-stone-500 text-[10px] block font-mono uppercase">Địa chỉ thực hiện</span>
                      <span className="font-medium text-stone-400 break-words">{booking.customerAddress || booking.serviceAddress || "Chưa có địa chỉ"}</span>
                    </div>

                    {booking.customerPhone && (
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <span className="text-stone-500 text-[10px] block font-mono uppercase mr-1">Liên hệ nhanh</span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getZaloContactUrl(booking.customerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-stone-850 hover:bg-stone-800 text-sky-400 rounded-lg transition-all"
                            title="Nhắn tin Zalo"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={getTelUrl(booking.customerPhone)}
                            className="p-1.5 bg-stone-850 hover:bg-stone-800 text-emerald-400 rounded-lg transition-all"
                            title="Gọi điện"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => copyPhoneToClipboard(booking.customerPhone!)}
                            className="p-1.5 bg-stone-850 hover:bg-stone-800 text-amber-450 rounded-lg transition-all cursor-pointer"
                            title="Copy số điện thoại"
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer issue descriptions and notes */}
                  {(booking.issueDescription || booking.userNotes || booking.customerNote) && (
                    <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-850 text-xs text-stone-400">
                      <span className="text-stone-500 text-[9px] block font-mono uppercase mb-1">Mô tả chi tiết & yêu cầu của khách</span>
                      <p className="italic">"{booking.issueDescription || booking.userNotes || booking.customerNote}"</p>
                    </div>
                  )}

                  {/* Cancel reason display if cancelled */}
                  {booking.status === "cancelled" && booking.cancelReason && (
                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-xs text-rose-400">
                      <span className="text-rose-500/60 text-[9px] block font-mono uppercase mb-1">Lý do hủy lịch</span>
                      <p className="font-semibold">"{booking.cancelReason}"</p>
                    </div>
                  )}

                  {/* Actions Area */}
                  {booking.status !== "completed" && booking.status !== "cancelled" && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-stone-850">
                      <button
                        onClick={() => handleOpenCancelModal(booking)}
                        disabled={updatingBookingId === booking.id}
                        className="px-3.5 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                      >
                        Hủy lịch hẹn
                      </button>

                      {booking.status === "pending" && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking, "CONFIRMED")}
                          disabled={updatingBookingId === booking.id}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingBookingId === booking.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Xác nhận lịch
                        </button>
                      )}

                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking, "IN_PROGRESS")}
                          disabled={updatingBookingId === booking.id}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingBookingId === booking.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Bắt đầu phục vụ
                        </button>
                      )}

                      {booking.status === "in_progress" && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking, "COMPLETED")}
                          disabled={updatingBookingId === booking.id}
                          className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingBookingId === booking.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Hoàn thành dịch vụ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bookings Pagination */}
            {bookingsTotalPages > 1 && (
              <div className="flex justify-between items-center pt-2 text-xs text-stone-400">
                <span>Trang {bookingsPage + 1} / {bookingsTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchBookings(bookingsPage - 1)}
                    disabled={bookingsPage === 0}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => fetchBookings(bookingsPage + 1)}
                    disabled={bookingsPage >= bookingsTotalPages - 1}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SERVICE MODAL POPUP */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-stone-100 font-display">
              {selectedService ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}
            </h3>

            {formValidationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs">
                {formValidationError}
              </div>
            )}

            <form onSubmit={handleSubmitService} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-stone-400 font-semibold">Tên dịch vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chăm sóc hoa phong lan tại nhà"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
                <span className="text-[10px] text-stone-500 text-right block font-mono">{formName.trim().length}/150 ký tự</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-stone-400 font-semibold">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ chi tiết công việc thực hiện (tỉa cành, bón phân, phòng sâu bệnh...)"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
                />
                <span className="text-[10px] text-stone-500 text-right block font-mono">{formDescription.trim().length}/1000 ký tự</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-stone-400 font-semibold">Giá dịch vụ (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-stone-400 font-semibold">Thời lượng (Phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="60"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl font-semibold cursor-pointer transition-all active:scale-95"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {savingService && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL POPUP */}
      {showCancelModal && cancelBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-rose-500 font-display">
              Xác Nhận Hủy Lịch Hẹn
            </h3>
            <p className="text-xs text-stone-400">
              Vui lòng nhập lý do hủy lịch hẹn này. Thông báo hủy lịch kèm lý do sẽ được gửi trực tiếp đến khách hàng.
            </p>

            {cancelReasonValidationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {cancelReasonValidationError}
              </div>
            )}

            <form onSubmit={handleSubmitCancel} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-stone-400 font-semibold">Lý do hủy *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập lý do chi tiết..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
                />
                <span className="text-[10px] text-stone-500 text-right block font-mono">{cancelReason.trim().length}/500 ký tự</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl font-semibold cursor-pointer transition-all active:scale-95"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={cancellingBooking}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-750 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {cancellingBooking && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xác Nhận Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
