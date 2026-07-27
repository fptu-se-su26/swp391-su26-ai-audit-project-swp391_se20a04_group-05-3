import { NotificationItem, BroadcastRequest } from "../types";
import { HttpClient } from "./httpClient";

export class NotificationService {
  public static async getNotifications(
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: NotificationItem[]; totalPages: number; number: number }> {
    const data = await HttpClient.get(`/api/notifications?page=${page}&size=${size}`, { signal });
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      number: data.number || 0
    };
  }

  public static async getUnreadCount(signal?: AbortSignal): Promise<number> {
    const data = await HttpClient.get("/api/notifications/unread-count", { signal });
    return Number(data);
  }

  public static async markAsRead(id: number, signal?: AbortSignal): Promise<NotificationItem> {
    return await HttpClient.put(`/api/notifications/${id}/read`, {}, { signal });
  }

  public static async markAllAsRead(signal?: AbortSignal): Promise<void> {
    await HttpClient.put("/api/notifications/read-all", {}, { signal });
  }

  public static async deleteNotification(id: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/notifications/${id}`, { signal });
  }

  public static async broadcastAnnouncement(request: BroadcastRequest, signal?: AbortSignal): Promise<void> {
    await HttpClient.post("/api/admin/notifications/broadcast", request, { signal });
  }
}
