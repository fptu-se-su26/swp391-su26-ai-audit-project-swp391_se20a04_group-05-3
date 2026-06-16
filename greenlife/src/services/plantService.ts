import { Product, Plant } from "../types";
import { PRODUCTS, MOCK_PLANTS } from "../data";

export class PlantService {
  private static async delay(ms = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retrieves products with search and category filters
   */
  public static async getProducts(
    search?: string,
    category?: string
  ): Promise<Product[]> {
    await this.delay(200);
    let list = [...PRODUCTS];

    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (category && category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    return list;
  }

  /**
   * Retrieves detailed biological profile for custom botanical species
   */
  public static async getBotanicalPlants(): Promise<Plant[]> {
    await this.delay(150);
    return MOCK_PLANTS;
  }

  /**
   * Performs quick eco score audits based on plant categories
   */
  public static auditCarbonOffset(product: Product): number {
    // Computes average Life-Cycle Assessment offset dynamically
    switch (product.category) {
      case "plants":
        return product.ecoScore * 0.4; // Average life range kg CO2 eq
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
}
