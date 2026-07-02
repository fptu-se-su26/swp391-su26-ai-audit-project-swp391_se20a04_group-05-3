import { BlogPost } from "../types";
import { HttpClient } from "./httpClient";

export function mapBackendBlogToBlogPost(item: any): BlogPost {
  let mappedCategory: "urban-farming" | "eco-living" | "plant-care" = "eco-living";
  if (item.category) {
    const cat = item.category;
    if (cat === "BASIC_CARE" || cat === "DISEASE") {
      mappedCategory = "plant-care";
    } else if (cat === "INSPIRATION" || cat === "GREEN_LIVING") {
      mappedCategory = "eco-living";
    } else if (cat === "URBAN_FARMING") {
      mappedCategory = "urban-farming";
    }
  }

  return {
    id: String(item.id),
    title: item.title || "",
    summary: item.summary || "",
    content: item.content || "",
    author: item.author?.fullName || "Nhà sáng lập GreenLife",
    date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("vi-VN") : new Date(item.createdAt).toLocaleDateString("vi-VN"),
    readTime: item.readingTime ? `${item.readingTime} phút đọc` : "5 phút đọc",
    category: mappedCategory,
    image: item.imageUrl || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600",
    views: item.views || 0,
    likes: 12,
    taggedProductIds: [],
    status: item.status || "PUBLISHED"
  };
}

export class ArticleService {
  /**
   * Fetch all articles/blog posts from the backend
   */
  public static async getArticles(
    keyword?: string,
    category?: string,
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: BlogPost[]; totalPages: number; totalElements: number }> {
    const queryParams: Record<string, string> = {
      page: String(page),
      size: String(size)
    };
    
    if (keyword && keyword.trim()) {
      queryParams.keyword = keyword.trim();
    }

    if (category && category !== "all") {
      let backendCategory = "GREEN_LIVING";
      if (category === "urban-farming") backendCategory = "URBAN_FARMING";
      else if (category === "plant-care") backendCategory = "BASIC_CARE";
      queryParams.category = backendCategory;
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const data = await HttpClient.get<any>(`/api/blogs?${queryString}`, { signal });

    const content = data.content || [];
    const mapped = content.map((item: any) => mapBackendBlogToBlogPost(item));

    return {
      content: mapped,
      totalPages: data.totalPages || 1,
      totalElements: data.totalElements || 0
    };
  }

  /**
   * Fetch a single blog post by ID
   */
  public static async getArticleById(id: number | string, signal?: AbortSignal): Promise<BlogPost> {
    const data = await HttpClient.get<any>(`/api/blogs/${id}`, { signal });
    return mapBackendBlogToBlogPost(data);
  }

  /**
   * Fetch all articles/blog posts for Admin from the backend
   */
  public static async getAdminArticles(
    keyword?: string,
    category?: string,
    status?: string,
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: BlogPost[]; totalPages: number; totalElements: number }> {
    const queryParams: Record<string, string> = {
      page: String(page),
      size: String(size)
    };
    
    if (keyword && keyword.trim()) {
      queryParams.keyword = keyword.trim();
    }

    if (category && category !== "all") {
      let backendCategory = "GREEN_LIVING";
      if (category === "urban-farming") backendCategory = "URBAN_FARMING";
      else if (category === "plant-care") backendCategory = "BASIC_CARE";
      queryParams.category = backendCategory;
    }

    if (status && status !== "all") {
      queryParams.status = status.toUpperCase();
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const data = await HttpClient.get<any>(`/api/admin/blogs?${queryString}`, { signal });

    const content = data.content || [];
    const mapped = content.map((item: any) => mapBackendBlogToBlogPost(item));

    return {
      content: mapped,
      totalPages: data.totalPages || 1,
      totalElements: data.totalElements || 0
    };
  }

  /**
   * Create a new article/blog post
   */
  public static async createArticle(
    article: {
      title: string;
      category: "urban-farming" | "eco-living" | "plant-care";
      summary: string;
      content: string;
      image: string;
      authorId?: string;
      taggedProductIds?: string[];
    },
    signal?: AbortSignal
  ): Promise<{ success: boolean; message: string; id?: string }> {
    let backendCategory = "GREEN_LIVING";
    if (article.category === "urban-farming") backendCategory = "URBAN_FARMING";
    else if (article.category === "plant-care") backendCategory = "BASIC_CARE";

    const body = {
      title: article.title,
      category: backendCategory,
      summary: article.summary,
      content: article.content,
      imageUrl: article.image || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600"
    };

    const data = await HttpClient.post<any>("/api/blogs", body, { signal });

    return {
      success: true,
      message: "Đăng bài viết thành công!",
      id: String(data.id)
    };
  }

  /**
   * Publish an existing article
   */
  public static async publishArticle(id: number | string, signal?: AbortSignal): Promise<{ success: boolean; message: string }> {
    await HttpClient.patch<any>(`/api/blogs/${id}/publish`, {}, { signal });
    return {
      success: true,
      message: "Đã xuất bản bài viết thành công!"
    };
  }

  /**
   * Archive an existing article
   */
  public static async archiveArticle(id: number | string, signal?: AbortSignal): Promise<{ success: boolean; message: string }> {
    await HttpClient.patch<any>(`/api/blogs/${id}/archive`, {}, { signal });
    return {
      success: true,
      message: "Đã lưu trữ bài viết thành công!"
    };
  }

  /**
   * Revert an existing article to draft status
   */
  public static async revertArticleToDraft(id: number | string, signal?: AbortSignal): Promise<{ success: boolean; message: string }> {
    await HttpClient.patch<any>(`/api/blogs/${id}/draft`, {}, { signal });
    return {
      success: true,
      message: "Đã chuyển bài viết thành bản nháp thành công!"
    };
  }
}
