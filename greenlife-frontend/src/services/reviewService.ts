import { HttpClient } from "./httpClient";

export interface ReviewResponse {
  id: number;
  customerDisplayName: string;
  plantId: number | null;
  storeId: number | null;
  rating: number;
  comment: string;
  status: "VISIBLE" | "HIDDEN";
  createdAt: string;
  updatedAt: string | null;
}

export interface RatingSummaryResponse {
  averageRating: number;
  totalReviews: number;
}

export interface PaginatedReviews {
  content: ReviewResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const ReviewService = {
  async getProductReviews(productId: number, page = 0, size = 10, signal?: AbortSignal): Promise<PaginatedReviews> {
    return HttpClient.get(`/api/reviews/plants/${productId}?page=${page}&size=${size}`, { signal });
  },

  async getStoreReviews(storeId: number, page = 0, size = 10, signal?: AbortSignal): Promise<PaginatedReviews> {
    return HttpClient.get(`/api/reviews/stores/${storeId}?page=${page}&size=${size}`, { signal });
  },

  async getPlantRatingSummary(productId: number, signal?: AbortSignal): Promise<RatingSummaryResponse> {
    return HttpClient.get(`/api/reviews/plants/${productId}/summary`, { signal });
  },

  async getStoreRatingSummary(storeId: number, signal?: AbortSignal): Promise<RatingSummaryResponse> {
    return HttpClient.get(`/api/reviews/stores/${storeId}/summary`, { signal });
  },

  async createReview(payload: {
    plantId?: number | null;
    storeId?: number | null;
    rating: number;
    comment: string;
  }, signal?: AbortSignal): Promise<ReviewResponse> {
    return HttpClient.post("/api/reviews", payload, { signal });
  },

  async updateReview(
    id: number,
    payload: { rating: number; comment: string },
    signal?: AbortSignal
  ): Promise<ReviewResponse> {
    return HttpClient.put(`/api/reviews/${id}`, payload, { signal });
  },

  async deleteReview(id: number, signal?: AbortSignal): Promise<void> {
    return HttpClient.delete(`/api/reviews/${id}`, { signal });
  },

  async getStoreOwnerReviews(page = 0, size = 10, signal?: AbortSignal): Promise<PaginatedReviews> {
    return HttpClient.get(`/api/store-owner/reviews?page=${page}&size=${size}`, { signal });
  },

  async getAllReviewsForAdmin(page = 0, size = 10, signal?: AbortSignal): Promise<PaginatedReviews> {
    return HttpClient.get(`/api/admin/reviews?page=${page}&size=${size}`, { signal });
  },

  async getAdminReviews(page = 0, size = 10, signal?: AbortSignal): Promise<PaginatedReviews> {
    return this.getAllReviewsForAdmin(page, size, signal);
  },

  async moderateReview(id: number, status: "VISIBLE" | "HIDDEN", signal?: AbortSignal): Promise<ReviewResponse> {
    return HttpClient.put(`/api/admin/reviews/${id}/status`, { status }, { signal });
  },
};
export default ReviewService;
