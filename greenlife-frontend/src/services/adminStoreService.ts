import { HttpClient } from "./httpClient";

export interface StoreResponse {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  description: string;
  logoUrl: string | null;
  verificationDocument: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export const AdminStoreService = {
  async getPendingStores(signal?: AbortSignal): Promise<StoreResponse[]> {
    return HttpClient.get("/api/admin/stores/pending", { signal });
  },

  async approveStore(id: number, reason?: string, signal?: AbortSignal): Promise<StoreResponse> {
    const payload = reason ? { reason } : {};
    return HttpClient.put(`/api/admin/stores/${id}/approve`, payload, { signal });
  },

  async rejectStore(id: number, reason: string, signal?: AbortSignal): Promise<StoreResponse> {
    return HttpClient.put(`/api/admin/stores/${id}/reject`, { reason }, { signal });
  },
};

export default AdminStoreService;
