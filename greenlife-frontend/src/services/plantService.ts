import { Product } from "../types";
import { HttpClient } from "./httpClient";

export function mapBackendProductToFrontend(item: any): Product {
  let mappedCategory: "plants" | "care" | "nutrients" | "smarthome" = "plants";
  
  if (item.categorySlug) {
    const slug = item.categorySlug.toLowerCase();
    if (
      slug === "cay-trong-nha" ||
      slug === "cay-ngoai-troi" ||
      slug === "cay-thuy-sinh" ||
      slug === "bonsai"
    ) {
      mappedCategory = "plants";
    } else if (slug === "phu-kien") {
      mappedCategory = "care";
    } else if (slug === "phan-bon") {
      mappedCategory = "nutrients";
    } else if (slug === "thiet-bi-thong-minh") {
      mappedCategory = "smarthome";
    }
  }

  return {
    id: String(item.id),
    name: item.name || "",
    category: mappedCategory,
    price: item.price || 0,
    rating: 5.0,
    image: item.imageUrl || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600",
    description: item.description || "",
    ecoScore: item.ecoScore || 90,
    details: ["Nguồn tự nhiên gieo trồng sạch", "Bao bì thân thiện môi trường"],
    specs: {
      "Nguồn gốc": item.storeName || "Nhà Vườn GreenLife",
      "Dấu chân carbon": `-${item.carbonFootprint || 12}kg CO2eq`,
      "Mức độ chăm sóc": item.careLevel || "Dễ",
      "Ánh sáng": item.sunlight || "Ánh sáng gián tiếp",
      "Tần suất tưới": item.waterLevel || "Tươi vừa phải"
    },
    stock: item.stock || 0,
    shopId: item.storeId ? String(item.storeId) : undefined,
    sku: item.sku || "",
    isBestSeller: !!item.isBestSeller,
    effectivePrice: item.effectivePrice,
    discountAmount: item.discountAmount,
    onSale: item.onSale,
    promotionId: item.promotionId,
    promotionName: item.promotionName,
    status: item.status
  };
}

export class PlantService {
  /**
   * Retrieves products with search and category filters from real backend
   */
  public static async getProducts(
    search?: string,
    category?: string,
    signal?: AbortSignal
  ): Promise<Product[]> {
    const queryParams: Record<string, string> = {
      size: "100" // Ensure we fetch enough products for the grid
    };

    if (search && search.trim()) {
      queryParams.search = search.trim();
    }

    if (category && category !== "all") {
      if (category === "care") {
        queryParams.category = "phu-kien";
      } else if (category === "nutrients") {
        queryParams.category = "phan-bon";
      } else if (category === "smarthome") {
        queryParams.category = "thiet-bi-thong-minh";
      }
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const data = await HttpClient.get<any>(`/api/products?${queryString}`, { signal });
    const content = data.content || [];

    let list = content.map((item: any) => mapBackendProductToFrontend(item));

    if (category === "plants") {
      list = list.filter((p: Product) => p.category === "plants");
    }

    return list;
  }

  /**
   * Retrieves detailed product by ID
   */
  public static async getProductById(id: string | number, signal?: AbortSignal): Promise<Product> {
    const item = await HttpClient.get<any>(`/api/products/${id}`, { signal });
    return mapBackendProductToFrontend(item);
  }

  /**
   * Performs quick eco score audits based on plant categories
   */
  public static auditCarbonOffset(product: Product): number {
    switch (product.category) {
      case "plants":
        return product.ecoScore * 0.4;
      case "nutrients":
        return product.ecoScore * 0.2;
      case "care":
        return product.ecoScore * 0.15;
      case "smarthome":
        return product.ecoScore * 0.1;
      default:
        return 5;
    }
  }

  /**
   * Retrieves products belonging to the logged-in store owner
   */
  public static async getMyStoreProducts(): Promise<Product[]> {
    const data = await HttpClient.get<any[]>("/api/store-owner/products");
    return data.map((item: any) => mapBackendProductToFrontend(item));
  }

  /**
   * Creates a new product for the logged-in store owner's approved store
   */
  public static async createMyStoreProduct(payload: any): Promise<Product> {
    const data = await HttpClient.post<any>("/api/store-owner/products", payload);
    return mapBackendProductToFrontend(data);
  }

  /**
   * Updates an existing product information and stock
   */
  public static async updateMyStoreProduct(id: string | number, payload: any): Promise<Product> {
    const data = await HttpClient.put<any>(`/api/store-owner/products/${id}`, payload);
    return mapBackendProductToFrontend(data);
  }

  /**
   * Soft deletes a product for the logged-in store owner
   */
  public static async deleteMyStoreProduct(id: string | number): Promise<void> {
    await HttpClient.delete<void>(`/api/store-owner/products/${id}`);
  }

  /**
   * Soft deletes a product as an administrator
   */
  public static async deleteProductAdmin(id: string | number): Promise<void> {
    await HttpClient.delete<void>(`/api/admin/products/${id}`);
  }
}
export default PlantService;
