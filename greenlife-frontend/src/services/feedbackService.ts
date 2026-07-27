import { Feedback } from "../types";
import { HttpClient } from "./httpClient";
import { logger } from "../utils/logger";

function parseProductId(productId: string): number {
  if (!productId) {
    throw new Error("Mã sản phẩm không được để trống.");
  }
  if (/^\d+$/.test(productId)) {
    return parseInt(productId, 10);
  }
  if (productId.startsWith("prod-")) {
    const numericPart = productId.substring(5);
    if (/^\d+$/.test(numericPart)) {
      return parseInt(numericPart, 10);
    }
  }
  throw new Error(`Định dạng mã sản phẩm không hợp lệ: ${productId}`);
}

export const FeedbackService = {
  async getProductFeedbacks(productId: string): Promise<Feedback[]> {
    try {
      const plantId = parseProductId(productId);
      const data = await HttpClient.get<any>(`/api/reviews/plants/${plantId}`);
      const content = data.content || [];
      return content.map((item: any) => ({
        id: item.id,
        productId: productId,
        userId: item.customerDisplayName || "Anonymous",
        orderId: "",
        rating: item.rating,
        comment: item.comment,
        images: [],
        createdAt: item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        userName: item.customerDisplayName || "Anonymous"
      }));
    } catch (err) {
      logger.error("Failed to load feedbacks:", err);
      return [];
    }
  },

  async submitFeedback(feedbackData: {
    productId: string;
    userId: string;
    orderId: string;
    rating: number;
    comment: string;
    images: string[];
  }): Promise<{ success: boolean; message: string }> {
    try {
      const plantId = parseProductId(feedbackData.productId);
      const payload = {
        plantId: plantId,
        rating: feedbackData.rating,
        comment: feedbackData.comment
      };
      await HttpClient.post<any>("/api/reviews", payload);
      return {
        success: true,
        message: "Đánh giá đã được gửi thành công.",
      };
    } catch (err: any) {
      logger.error("Failed to submit feedback:", err);
      return {
        success: false,
        message: err.message || "Lỗi kết nối hệ thống khi gửi đánh giá.",
      };
    }
  },
};
