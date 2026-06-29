import { HttpClient } from "./httpClient";
import { StoreOrder } from "../types";

export interface CheckoutPayload {
  addressId?: number | null;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  note?: string;
  paymentMethod: "COD" | "VNPAY";
}

export class OrderService {
  private static normalizeStatus(status: string): "pending" | "processing" | "shipped" | "cancelled" | "completed" {
    if (!status) return "pending";
    const upper = status.toUpperCase();
    if (upper === "CONFIRMED") return "processing";
    if (upper === "SHIPPING") return "shipped";
    if (upper === "DELIVERED") return "completed";
    if (upper === "CANCELLED") return "cancelled";
    return "pending";
  }

  public static mapBackendToOrder(backend: any): StoreOrder {
    const details = backend.details || [];
    const itemsSummary = details.map((d: any) => `${d.productName} x${d.quantity}`).join(", ");
    const itemsCount = details.reduce((sum: number, d: any) => sum + d.quantity, 0);

    return {
      id: String(backend.id),
      date: backend.createdAt ? backend.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      items: itemsSummary || "Sản phẩm sinh thái",
      itemsCount: itemsCount || 1,
      total: backend.totalAmount || 0,
      status: this.normalizeStatus(backend.status),
      customerName: backend.recipientName || "",
      recipientPhone: backend.recipientPhone || "",
      shippingAddress: backend.shippingAddress || "",
      note: backend.note || "",
      paymentMethod: backend.paymentMethod || "COD",
      paymentStatus: backend.paymentStatus || "PENDING",
      paymentUrl: backend.paymentUrl || null,
      backendStatus: backend.status,
      itemsList: details.map((d: any) => ({
        productId: String(d.plantId),
        productName: d.productName || "Sản phẩm",
        imageUrl: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150",
        quantity: d.quantity,
        unitPrice: d.unitPrice
      }))
    };
  }

  public static async checkoutCart(payload: CheckoutPayload, signal?: AbortSignal): Promise<StoreOrder[]> {
    const data = await HttpClient.post<any[]>("/api/checkout", payload, { signal });
    return (data || []).map((order: any) => this.mapBackendToOrder(order));
  }

  public static async getOrders(signal?: AbortSignal): Promise<StoreOrder[]> {
    const data = await HttpClient.get<any[]>("/api/orders", { signal });
    return (data || []).map((order: any) => this.mapBackendToOrder(order));
  }

  public static async getOrderById(id: string, signal?: AbortSignal): Promise<StoreOrder> {
    const data = await HttpClient.get(`/api/orders/${id}`, { signal });
    return this.mapBackendToOrder(data);
  }

  public static async cancelOrder(id: string, signal?: AbortSignal): Promise<StoreOrder> {
    const data = await HttpClient.put(`/api/orders/${id}/cancel`, {}, { signal });
    return this.mapBackendToOrder(data);
  }

  public static async getStoreOwnerOrders(signal?: AbortSignal): Promise<StoreOrder[]> {
    const data = await HttpClient.get<any[]>("/api/store-owner/orders", { signal });
    return (data || []).map((order: any) => this.mapBackendToOrder(order));
  }

  public static async getStoreOwnerOrderDetail(orderId: string | number, signal?: AbortSignal): Promise<StoreOrder> {
    const data = await HttpClient.get(`/api/store-owner/orders/${orderId}`, { signal });
    return this.mapBackendToOrder(data);
  }

  public static async updateStoreOwnerOrderStatus(
    orderId: string | number,
    status: string,
    signal?: AbortSignal
  ): Promise<StoreOrder> {
    const data = await HttpClient.put(
      `/api/store-owner/orders/${orderId}/status`,
      { status },
      { signal }
    );
    return this.mapBackendToOrder(data);
  }
}
export default OrderService;
