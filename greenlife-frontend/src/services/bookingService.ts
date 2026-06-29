import { Appointment } from "../types";
import { HttpClient } from "./httpClient";

export interface PaginatedBookings {
  content: Appointment[];
  totalPages: number;
  totalElements: number;
  page: number;
}

export class BookingService {
  private static mapStatus(backendStatus: string): any {
    switch (backendStatus) {
      case "PENDING": return "pending";
      case "CONFIRMED": return "confirmed";
      case "IN_PROGRESS": return "in_progress";
      case "COMPLETED": return "completed";
      case "CANCELLED": return "cancelled";
      default: return "pending";
    }
  }

  private static mapBookingResponseToAppointment(backend: any): Appointment {
    return {
      id: String(backend.id),
      expertName: backend.storeNameSnapshot || "Chuyên gia GreenLife",
      title: backend.serviceNameSnapshot || "Dịch vụ tham vấn",
      date: backend.scheduledAt ? backend.scheduledAt.split("T")[0] : "",
      time: backend.scheduledAt ? backend.scheduledAt.split("T")[1].substring(0, 5) : "",
      type: backend.serviceAddress && backend.serviceAddress.toLowerCase().includes("online") ? "online" : "offline",
      price: Number(backend.servicePriceSnapshot),
      status: this.mapStatus(backend.status),
      durationMinutes: backend.durationMinutes || 60,
      expertAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      userNotes: backend.customerNote || "",
      customerName: backend.customerName,
      serviceAddress: backend.serviceAddress,
      customerNote: backend.customerNote,
      cancelReason: backend.cancelReason
    } as any;
  }

  public static async getCustomerBookings(
    page: number = 0,
    size: number = 10,
    signal?: AbortSignal
  ): Promise<PaginatedBookings> {
    const data = await HttpClient.get<any>(`/api/bookings/customer?page=${page}&size=${size}`, { signal });
    return {
      content: (data.content || []).map((b: any) => this.mapBookingResponseToAppointment(b)),
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
      page: data.number || 0
    };
  }

  public static async getStoreBookings(
    storeId: number,
    page: number = 0,
    size: number = 10,
    signal?: AbortSignal
  ): Promise<PaginatedBookings> {
    const data = await HttpClient.get<any>(`/api/bookings/store?storeId=${storeId}&page=${page}&size=${size}`, { signal });
    return {
      content: (data.content || []).map((b: any) => this.mapBookingResponseToAppointment(b)),
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
      page: data.number || 0
    };
  }

  public static async getBookingById(id: string | number, signal?: AbortSignal): Promise<Appointment> {
    const data = await HttpClient.get<any>(`/api/bookings/${id}`, { signal });
    return this.mapBookingResponseToAppointment(data);
  }

  public static async createBooking(
    payload: {
      serviceId: number;
      scheduledAt: string;
      serviceAddress: string;
      customerNote?: string;
    },
    signal?: AbortSignal
  ): Promise<Appointment> {
    const data = await HttpClient.post<any>("/api/bookings", payload, { signal });
    return this.mapBookingResponseToAppointment(data);
  }

  public static async cancelBooking(id: string | number, cancelReason: string, signal?: AbortSignal): Promise<Appointment> {
    const data = await HttpClient.put<any>(`/api/bookings/${id}/cancel`, { cancelReason }, { signal });
    return this.mapBookingResponseToAppointment(data);
  }
}
