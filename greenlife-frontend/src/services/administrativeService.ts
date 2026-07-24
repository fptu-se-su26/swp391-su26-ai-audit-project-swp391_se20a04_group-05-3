import { HttpClient } from "./httpClient";

export interface AdministrativeProvinceDTO {
  id: number;
  name: string;
}

export interface AdministrativeCommuneDTO {
  code: string;
  type: string;
  name: string;
  displayName: string;
}

export class AdministrativeService {
  private static cachedProvinces: AdministrativeProvinceDTO[] | null = null;
  private static cachedCommunesMap: Map<number, AdministrativeCommuneDTO[]> = new Map();

  public static async getProvinces(): Promise<AdministrativeProvinceDTO[]> {
    if (this.cachedProvinces && this.cachedProvinces.length > 0) {
      return this.cachedProvinces;
    }
    const data = await HttpClient.get<AdministrativeProvinceDTO[]>("/api/administrative/provinces");
    this.cachedProvinces = data || [];
    return this.cachedProvinces;
  }

  public static async getCommunesByProvince(provinceId: number): Promise<AdministrativeCommuneDTO[]> {
    if (!provinceId) return [];
    if (this.cachedCommunesMap.has(provinceId)) {
      return this.cachedCommunesMap.get(provinceId)!;
    }
    const data = await HttpClient.get<AdministrativeCommuneDTO[]>(`/api/administrative/communes?provinceId=${provinceId}`);
    const result = data || [];
    this.cachedCommunesMap.set(provinceId, result);
    return result;
  }
}

export default AdministrativeService;
