import { Feedback } from "../types";

export const FeedbackService = {
  async getProductFeedbacks(productId: string): Promise<Feedback[]> {
    try {
      const response = await fetch(`/api/feedbacks/product/${productId}`);
      const data = await response.json();
      if (data.success) {
        return data.feedbacks;
      }
      return [];
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
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
      const storedUser = localStorage.getItem("greenlife_current_user");
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(feedbackData),
      });
      const data = await response.json();
      return {
        success: data.success,
        message: data.message || data.error || "Gặp sự cố khi gửi đánh giá.",
      };
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      return {
        success: false,
        message: "Lỗi kết nối hệ thống khi gửi đánh giá.",
      };
    }
  },
};
