import { HttpClient } from "./httpClient";

export interface OrderDetailResponse {
  id: number;
  plantId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  storeId: number;
  storeName: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  note: string | null;
  createdAt: string;
  paymentUrl: string | null;
  details: OrderDetailResponse[];
}

export const AdminOrderService = {
  async getAllOrders(signal?: AbortSignal): Promise<OrderResponse[]> {
    return HttpClient.get("/api/admin/orders", { signal });
  },

  async getOrderDetail(id: number, signal?: AbortSignal): Promise<OrderResponse> {
    return HttpClient.get(`/api/admin/orders/${id}`, { signal });
  },
};

export default AdminOrderService;
