import { 
  BlogPost, 
  AuthorBlogResponse, 
  AdminBlogReviewResponse, 
  ImportDocumentResponse 
} from "../types";
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

  // --- NEW MODERATED BLOG PLATFORM ENDPOINTS ---

  /**
   * Import document (.txt, .md, .docx)
   */
  public static async importDocument(file: File, signal?: AbortSignal): Promise<ImportDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);

    // Using fetch directly because HttpClient might have generic JSON headers
    const token = localStorage.getItem("token"); // GreenLife standard token key
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/blogs/import-document", {
      method: "POST",
      headers,
      body: formData,
      signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Không thể tải lên tài liệu");
    }

    return response.json();
  }

  /**
   * Get current user's blog posts (Author list view)
   */
  public static async getMyBlogs(
    keyword?: string,
    category?: string,
    status?: string,
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: AuthorBlogResponse[]; totalPages: number; totalElements: number }> {
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
    const data = await HttpClient.get<any>(`/api/blogs/my?${queryString}`, { signal });

    return {
      content: data.content || [],
      totalPages: data.totalPages || 1,
      totalElements: data.totalElements || 0
    };
  }

  /**
   * Get single author blog detail including revision history
   */
  public static async getAuthorBlogById(id: number | string, signal?: AbortSignal): Promise<AuthorBlogResponse> {
    return HttpClient.get<AuthorBlogResponse>(`/api/blogs/my/${id}`, { signal });
  }

  /**
   * Create a new blog draft
   */
  public static async createBlog(
    article: {
      title: string;
      category: string;
      summary: string;
      content: string;
      imageUrl: string;
      sourceType?: string;
      sourceFileName?: string;
    },
    signal?: AbortSignal
  ): Promise<AuthorBlogResponse> {
    return HttpClient.post<AuthorBlogResponse>("/api/blogs", article, { signal });
  }

  /**
   * Spawn a new draft revision for edit (for PUBLISHED or REJECTED articles)
   */
  public static async createDraftRevision(id: number | string, signal?: AbortSignal): Promise<AuthorBlogResponse> {
    return HttpClient.post<AuthorBlogResponse>(`/api/blogs/${id}/revisions`, {}, { signal });
  }

  /**
   * Update an existing draft revision
   */
  public static async updateBlog(
    id: number | string,
    article: {
      title: string;
      category: string;
      summary: string;
      content: string;
      imageUrl: string;
      version: number;
      sourceType?: string;
      sourceFileName?: string;
    },
    signal?: AbortSignal
  ): Promise<AuthorBlogResponse> {
    return HttpClient.put<AuthorBlogResponse>(`/api/blogs/${id}`, article, { signal });
  }

  /**
   * Submit draft revision for moderation review
   */
  public static async submitBlog(
    id: number | string,
    version: number,
    signal?: AbortSignal
  ): Promise<AuthorBlogResponse> {
    return HttpClient.post<AuthorBlogResponse>(`/api/blogs/${id}/submit`, { version }, { signal });
  }

  /**
   * Withdraw a pending moderation request
   */
  public static async withdrawBlog(
    id: number | string,
    version: number,
    signal?: AbortSignal
  ): Promise<AuthorBlogResponse> {
    return HttpClient.post<AuthorBlogResponse>(`/api/blogs/${id}/withdraw`, { version }, { signal });
  }

  /**
   * Delete draft/unpublished blog post
   */
  public static async deleteBlog(id: number | string, signal?: AbortSignal): Promise<void> {
    return HttpClient.delete<void>(`/api/blogs/${id}`, { signal });
  }

  // --- ADMIN MODERATION ENDPOINTS ---

  /**
   * Fetch all articles/blog posts for Admin (lists submitted ones)
   */
  public static async getAdminBlogs(
    keyword?: string,
    category?: string,
    status?: string,
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: AdminBlogReviewResponse[]; totalPages: number; totalElements: number }> {
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

    return {
      content: data.content || [],
      totalPages: data.totalPages || 1,
      totalElements: data.totalElements || 0
    };
  }

  /**
   * Get single blog review detail for Admin
   */
  public static async getAdminBlogById(id: number | string, signal?: AbortSignal): Promise<AdminBlogReviewResponse> {
    return HttpClient.get<AdminBlogReviewResponse>(`/api/admin/blogs/${id}`, { signal });
  }

  /**
   * Approve a blog submission
   */
  public static async approveBlog(
    id: number | string,
    version: number,
    note?: string,
    signal?: AbortSignal
  ): Promise<AdminBlogReviewResponse> {
    return HttpClient.patch<AdminBlogReviewResponse>(`/api/admin/blogs/${id}/approve`, { version, note }, { signal });
  }

  /**
   * Request changes on a blog submission
   */
  public static async requestChanges(
    id: number | string,
    version: number,
    note: string,
    signal?: AbortSignal
  ): Promise<AdminBlogReviewResponse> {
    return HttpClient.patch<AdminBlogReviewResponse>(`/api/admin/blogs/${id}/request-changes`, { version, note }, { signal });
  }

  /**
   * Reject a blog submission
   */
  public static async rejectBlog(
    id: number | string,
    version: number,
    note: string,
    signal?: AbortSignal
  ): Promise<AdminBlogReviewResponse> {
    return HttpClient.patch<AdminBlogReviewResponse>(`/api/admin/blogs/${id}/reject`, { version, note }, { signal });
  }

  /**
   * Archive a blog (Admin)
   */
  public static async archiveBlog(id: number | string, signal?: AbortSignal): Promise<BlogPost> {
    return HttpClient.patch<BlogPost>(`/api/admin/blogs/${id}/archive`, {}, { signal });
  }
}
