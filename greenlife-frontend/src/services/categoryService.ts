import { HttpClient } from "./httpClient";
import { logger } from "../utils/logger";

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
}

let cache: {
  data: CategoryResponse[];
  timestamp: number;
} | null = null;

const TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function getCategories(signal?: AbortSignal): Promise<CategoryResponse[]> {
  const now = Date.now();
  if (cache && (now - cache.timestamp < TTL_MS)) {
    return cache.data;
  }

  try {
    const data = await HttpClient.get<CategoryResponse[]>("/api/categories", { signal });
    cache = {
      data,
      timestamp: now
    };
    return data;
  } catch (err) {
    logger.error("Lỗi tải danh mục:", err);
    if (cache) {
      return cache.data;
    }
    throw err;
  }
}

export async function clearCache(): Promise<void> {
  cache = null;
}

export const CategoryService = {
  getCategories,
  clearCache
};
