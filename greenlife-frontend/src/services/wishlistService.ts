import { HttpClient } from "./httpClient";

export class WishlistService {
  public static async addWishlist(plantId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.post(`/api/wishlist/${plantId}`, {}, { signal });
  }

  public static async removeWishlist(plantId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/wishlist/${plantId}`, { signal });
  }

  public static async getWishlist(page = 0, size = 10, signal?: AbortSignal): Promise<any[]> {
    const data = await HttpClient.get(`/api/wishlist?page=${page}&size=${size}`, { signal });
    return data.content || [];
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
