import { HttpClient } from "./httpClient";

export type PlantStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export interface CustomerWishlistItem {
  id: number;
  plantId: number;
  plantName: string;
  plantPrice: number;
  plantImage: string | null;
  plantStatus: PlantStatus;
  addedAt: string;
}

export class WishlistService {
  public static async addWishlist(plantId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.post(`/api/wishlist/${plantId}`, {}, { signal });
  }

  public static async removeWishlist(plantId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/wishlist/${plantId}`, { signal });
  }

  public static async getWishlist(page = 0, size = 10, signal?: AbortSignal): Promise<CustomerWishlistItem[]> {
    const data = await HttpClient.get(`/api/wishlist?page=${page}&size=${size}`, { signal });
    return Array.isArray(data?.content) ? data.content : [];
  }

  public static async checkWishlist(plantId: number, signal?: AbortSignal): Promise<boolean> {
    try {
      const data = await HttpClient.get(`/api/wishlist/check/${plantId}`, { signal });
      return !!data.favorited;
    } catch {
      return false;
    }
  }
}
export default WishlistService;
