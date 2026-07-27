/**
 * Centralized Vietnam Two-Level Administrative Units Types and Helpers
 * Basis: Official General Statistics Office (GSO) & Decision 19/2025/QĐ-TTg
 * Effective Date: 01 July 2025
 */

export interface AdministrativeCommune {
  code: string;
  name: string;
  type: string;
  provinceId?: number;
}

export interface AdministrativeProvince {
  id?: number;
  code?: string;
  name: string;
  communes?: AdministrativeCommune[];
}

export const formatTwoLevelAddress = (
  detailAddress: string,
  communeName: string,
  provinceName: string,
  districtName?: string
): string => {
  const parts = [detailAddress, communeName, districtName, provinceName].filter(
    (p) => p && p.trim().length > 0
  );
  return parts.join(", ");
};
