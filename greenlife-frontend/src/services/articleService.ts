import { BlogPost } from "../types";
import { BLOG_POSTS } from "../data";

export class ArticleService {
  private static async delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch all articles/blog posts from the backend
   */
  public static async getArticles(): Promise<BlogPost[]> {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      if (data.success && data.articles) {
        return data.articles;
      }
      throw new Error(data.error || "Không thể tải danh sách cẩm nang xanh.");
    } catch (err) {
      console.warn("⚠️ API Cẩm nang lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(150);
      return BLOG_POSTS;
    }
  }

  /**
   * Create a new article/blog post
   */
  public static async createArticle(article: {
    title: string;
    category: "urban-farming" | "eco-living" | "plant-care";
    summary: string;
    content: string;
    image: string;
    authorId: string;
    taggedProductIds: string[];
  }): Promise<{ success: boolean; message: string }> {
    try {
      const storedUser = localStorage.getItem("greenlife_current_user");
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(article),
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, message: data.message || "Đăng bài viết thành công!" };
      }
      throw new Error(data.error || "Không thể đăng bài viết.");
    } catch (err: any) {
      console.warn("⚠️ Lưu bài viết API lỗi, kích hoạt chế độ giả lập offline:", err);
      await this.delay(150);
      // Simulating local addition
      const newLocalArt: BlogPost = {
        id: `blog-mock-${Date.now()}`,
        title: article.title,
        category: article.category,
        summary: article.summary || (article.content.substring(0, 150) + "..."),
        content: article.content,
        image: article.image || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600",
        date: new Date().toLocaleDateString("vi-VN"),
        readTime: "5 phút đọc",
        author: "Nhà Vườn GreenPartner (Simulated)",
        views: 0,
        taggedProductIds: article.taggedProductIds || []
      };
      
      // We can push it to local mock array for this session
      BLOG_POSTS.unshift(newLocalArt);
      return { success: true, message: "Bài viết đã ghi nhận thành công (Giả lập offline)." };
    }
  }
}
