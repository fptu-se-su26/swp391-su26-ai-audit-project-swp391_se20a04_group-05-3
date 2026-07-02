import { CartItem } from "../types";
import { HttpClient } from "./httpClient";

export class CartService {
  public static async getCart(signal?: AbortSignal): Promise<{ items: CartItem[]; subtotal: number }> {
    const data = await HttpClient.get("/api/cart", { signal });
    const items: CartItem[] = (data.items || []).map((item: any) => ({
      id: item.id,
      product: {
        id: String(item.plantId),
        name: item.plantName,
        price: item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: 999
      },
      quantity: item.quantity
    }));

    return {
      items,
      subtotal: data.subtotal || 0
    };
  }

  public static async addToCart(plantId: number, quantity: number, signal?: AbortSignal): Promise<CartItem> {
    const item = await HttpClient.post("/api/cart/items", { plantId, quantity }, { signal });
    return {
      id: item.id,
      product: {
        id: String(item.plantId),
        name: item.plantName,
        price: item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: 999
      },
      quantity: item.quantity
    };
  }

  public static async updateCartItem(itemId: number, quantity: number, signal?: AbortSignal): Promise<CartItem> {
    const item = await HttpClient.put(`/api/cart/items/${itemId}`, { quantity }, { signal });
    return {
      id: item.id,
      product: {
        id: String(item.plantId),
        name: item.plantName,
        price: item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: 999
      },
      quantity: item.quantity
    };
  }

  public static async removeCartItem(itemId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/cart/items/${itemId}`, { signal });
  }
}
export default CartService;
