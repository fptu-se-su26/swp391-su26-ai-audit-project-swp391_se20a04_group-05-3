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
  businessType?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface AdminStoreReviewResponse extends StoreResponse {
  cccdFrontUrl?: string | null;
  cccdBackUrl?: string | null;
  businessEvidenceUrls?: string[] | null;
}

export interface PromotionStoreOption {
  id: number;
  name: string;
  city: string;
  district: string;
}


export const AdminStoreService = {
  async getPendingStores(signal?: AbortSignal): Promise<AdminStoreReviewResponse[]> {
    return HttpClient.get("/api/admin/stores/pending", { signal });
  },

  async getApprovedStores(signal?: AbortSignal): Promise<AdminStoreReviewResponse[]> {
    return HttpClient.get("/api/admin/stores/approved", { signal });
  },

  async approveStore(id: number, reason?: string, signal?: AbortSignal): Promise<StoreResponse> {
    const payload = reason ? { reason } : {};
    return HttpClient.put(`/api/admin/stores/${id}/approve`, payload, { signal });
  },

  async rejectStore(id: number, reason: string, signal?: AbortSignal): Promise<AdminStoreReviewResponse> {
    return HttpClient.put(`/api/admin/stores/${id}/reject`, { reason }, { signal });
  },

  async fetchKycDocumentBlob(urlOrPath: string): Promise<string> {
    if (!urlOrPath) return "";
    const cleanPath = urlOrPath.trim();
    const filename = cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
    if (!filename) return "";
    const blob = await HttpClient.getBlob(`/api/kyc/files/${filename}`);
    return URL.createObjectURL(blob);
  },
};

export default AdminStoreService;
