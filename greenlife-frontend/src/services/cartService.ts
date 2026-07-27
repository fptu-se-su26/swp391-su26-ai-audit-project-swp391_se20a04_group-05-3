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
        price: item.baseUnitPrice !== undefined ? item.baseUnitPrice : item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: item.plantStock !== undefined ? item.plantStock : 999,
        effectivePrice: item.effectiveUnitPrice !== undefined ? item.effectiveUnitPrice : item.plantPrice,
        discountAmount: item.unitDiscount,
        onSale: item.onSale,
        promotionId: item.promotionId,
        promotionName: item.promotionName
      },
      quantity: item.quantity,
      baseUnitPrice: item.baseUnitPrice,
      effectiveUnitPrice: item.effectiveUnitPrice,
      unitDiscount: item.unitDiscount,
      lineBaseAmount: item.lineBaseAmount,
      lineEffectiveAmount: item.lineEffectiveAmount,
      lineDiscountAmount: item.lineDiscountAmount,
      onSale: item.onSale,
      promotionId: item.promotionId,
      promotionName: item.promotionName
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
        price: item.baseUnitPrice !== undefined ? item.baseUnitPrice : item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: item.plantStock !== undefined ? item.plantStock : 999,
        effectivePrice: item.effectiveUnitPrice !== undefined ? item.effectiveUnitPrice : item.plantPrice,
        discountAmount: item.unitDiscount,
        onSale: item.onSale,
        promotionId: item.promotionId,
        promotionName: item.promotionName
      },
      quantity: item.quantity,
      baseUnitPrice: item.baseUnitPrice,
      effectiveUnitPrice: item.effectiveUnitPrice,
      unitDiscount: item.unitDiscount,
      lineBaseAmount: item.lineBaseAmount,
      lineEffectiveAmount: item.lineEffectiveAmount,
      lineDiscountAmount: item.lineDiscountAmount,
      onSale: item.onSale,
      promotionId: item.promotionId,
      promotionName: item.promotionName
    };
  }

  public static async updateCartItem(itemId: number, quantity: number, signal?: AbortSignal): Promise<CartItem> {
    const item = await HttpClient.put(`/api/cart/items/${itemId}`, { quantity }, { signal });
    return {
      id: item.id,
      product: {
        id: String(item.plantId),
        name: item.plantName,
        price: item.baseUnitPrice !== undefined ? item.baseUnitPrice : item.plantPrice,
        image: item.plantImageUrl,
        rating: 5,
        category: "plants",
        description: "",
        ecoScore: 100,
        details: [],
        specs: {},
        stock: item.plantStock !== undefined ? item.plantStock : 999,
        effectivePrice: item.effectiveUnitPrice !== undefined ? item.effectiveUnitPrice : item.plantPrice,
        discountAmount: item.unitDiscount,
        onSale: item.onSale,
        promotionId: item.promotionId,
        promotionName: item.promotionName
      },
      quantity: item.quantity,
      baseUnitPrice: item.baseUnitPrice,
      effectiveUnitPrice: item.effectiveUnitPrice,
      unitDiscount: item.unitDiscount,
      lineBaseAmount: item.lineBaseAmount,
      lineEffectiveAmount: item.lineEffectiveAmount,
      lineDiscountAmount: item.lineDiscountAmount,
      onSale: item.onSale,
      promotionId: item.promotionId,
      promotionName: item.promotionName
    };
  }

  public static async removeCartItem(itemId: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/cart/items/${itemId}`, { signal });
  }
}
export default CartService;
