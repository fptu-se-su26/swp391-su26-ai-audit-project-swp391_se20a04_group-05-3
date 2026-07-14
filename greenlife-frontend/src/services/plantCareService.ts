import { HttpClient } from "./httpClient";
import { PlantCareService } from "../types";

export interface PaginatedServices {
  content: PlantCareService[];
  totalPages: number;
  totalElements: number;
  page: number;
}

export class PlantCareServiceAPI {
  /**
   * Retrieves active services with filtering
   */
  public static async getServices(
    params: {
      storeId?: number;
      city?: string;
      district?: string;
      keyword?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      size?: number;
    },
    signal?: AbortSignal
  ): Promise<PaginatedServices> {
    const queryParams: Record<string, string> = {
      page: String(params.page ?? 0),
      size: String(params.size ?? 10)
    };

    if (params.storeId !== undefined) {
      queryParams.storeId = String(params.storeId);
    }
    if (params.city && params.city.trim()) {
      queryParams.city = params.city.trim();
    }
    if (params.district && params.district.trim()) {
      queryParams.district = params.district.trim();
    }
    if (params.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim();
    }
    if (params.minPrice !== undefined) {
      queryParams.minPrice = String(params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      queryParams.maxPrice = String(params.maxPrice);
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const data = await HttpClient.get<any>(`/api/services?${queryString}`, { signal });
    
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
      page: data.number || 0
    };
  }

  /**
   * Retrieves detailed service by ID
   */
  public static async getServiceDetail(id: number | string, signal?: AbortSignal): Promise<PlantCareService> {
    return await HttpClient.get<PlantCareService>(`/api/services/${id}`, { signal });
  }

  /**
   * Retrieves store services for store owner
   */
  public static async getStoreOwnerServices(
    storeId?: number,
    page: number = 0,
    size: number = 10,
    signal?: AbortSignal
  ): Promise<PaginatedServices> {
    const query = storeId !== undefined ? `?storeId=${storeId}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
    const data = await HttpClient.get<any>(`/api/store-owner/services${query}`, { signal });
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
      page: data.number || 0
    };
  }

  /**
   * Creates a new service for store owner
   */
  public static async createService(
    payload: {
      storeId: number;
      name: string;
      description?: string;
      price: number;
      durationMinutes: number;
    },
    signal?: AbortSignal
  ): Promise<PlantCareService> {
    return await HttpClient.post<PlantCareService>("/api/store-owner/services", payload, { signal });
  }

  /**
   * Updates an existing service for store owner
   */
  public static async updateService(
    id: number | string,
    payload: {
      storeId: number;
      name: string;
      description?: string;
      price: number;
      durationMinutes: number;
    },
    signal?: AbortSignal
  ): Promise<PlantCareService> {
    return await HttpClient.put<PlantCareService>(`/api/store-owner/services/${id}`, payload, { signal });
  }

  /**
   * Updates service status (ACTIVE/INACTIVE) for store owner
   */
  public static async updateServiceStatus(
    id: number | string,
    status: "ACTIVE" | "INACTIVE",
    signal?: AbortSignal
  ): Promise<PlantCareService> {
    return await HttpClient.put<PlantCareService>(`/api/store-owner/services/${id}/status`, { status }, { signal });
  }
}
