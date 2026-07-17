import { HttpClient } from "./httpClient";

export type PromotionScopeType = "GLOBAL" | "STORE" | "PRODUCT";
export type PromotionDiscountType = "PERCENTAGE" | "FIXED";
export type PromotionFundingSource = "PLATFORM_FUNDED" | "STORE_FUNDED" | "CO_FUNDED";
export type PromotionStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  scopeType: PromotionScopeType;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  fundingSource: PromotionFundingSource;
  platformFundingRatio: number;
  storeFundingRatio: number;
  priority: number;
  budget: number;
  storeIds?: number[];
  productIds?: number[];
}

export interface UpdatePromotionDraftRequest extends CreatePromotionRequest {
  version: number;
}

export interface PromotionActionRequest {
  version: number;
  reason?: string;
}

export interface PromotionAuditHistoryDto {
  id: number;
  actionType: string;
  actorUserId: number;
  previousStatus: PromotionStatus;
  newStatus: PromotionStatus;
  reason?: string | null;
  createdAt: string;
}

export interface PromotionSummaryResponse {
  id: number;
  name: string;
  scopeType: PromotionScopeType;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  fundingSource: PromotionFundingSource;
  platformFundingRatio: number;
  storeFundingRatio: number;
  priority: number;
  budget: number;
  reservedBudget: number;
  consumedBudget: number;
  availableBudget: number;
  status: PromotionStatus;
  version: number;
  createdAt: string;
  activatedAt?: string | null;
  endedAt?: string | null;
}

export interface PromotionDetailResponse extends PromotionSummaryResponse {
  description?: string | null;
  releasedBudget: number;
  createdById: number;
  activatedById?: number | null;
  endedById?: number | null;
  endReason?: string | null;
  storeIds: number[];
  productIds: number[];
  auditHistory: PromotionAuditHistoryDto[];
}

export interface PaginatedPromotions {
  content: PromotionSummaryResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const AdminPromotionService = {
  async createDraft(request: CreatePromotionRequest, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    return HttpClient.post("/api/admin/promotions", request, { signal });
  },

  async updateDraft(id: number, request: UpdatePromotionDraftRequest, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    return HttpClient.put(`/api/admin/promotions/${id}`, request, { signal });
  },

  async activate(id: number, version: number, reason?: string, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    const payload: PromotionActionRequest = { version, reason };
    return HttpClient.post(`/api/admin/promotions/${id}/activate`, payload, { signal });
  },

  async end(id: number, version: number, reason?: string, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    const payload: PromotionActionRequest = { version, reason };
    return HttpClient.post(`/api/admin/promotions/${id}/end`, payload, { signal });
  },

  async cancel(id: number, version: number, reason?: string, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    const payload: PromotionActionRequest = { version, reason };
    return HttpClient.post(`/api/admin/promotions/${id}/cancel`, payload, { signal });
  },

  async list(
    params: {
      status?: PromotionStatus;
      scopeType?: PromotionScopeType;
      page?: number;
      size?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<PaginatedPromotions> {
    const queryParts: string[] = [];
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.scopeType) queryParts.push(`scopeType=${encodeURIComponent(params.scopeType)}`);
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.size !== undefined) queryParts.push(`size=${params.size}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return HttpClient.get(`/api/admin/promotions${queryString}`, { signal });
  },

  async getDetail(id: number, signal?: AbortSignal): Promise<PromotionDetailResponse> {
    return HttpClient.get(`/api/admin/promotions/${id}`, { signal });
  }
};

export default AdminPromotionService;
