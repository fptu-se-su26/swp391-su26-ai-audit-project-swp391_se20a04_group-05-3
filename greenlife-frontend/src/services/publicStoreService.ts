import { HttpClient } from "./httpClient";
import { PublicStore } from "../types";
import { logger } from "../utils/logger";

export async function getPublicStores(signal?: AbortSignal): Promise<PublicStore[]> {
  try {
    const data = await HttpClient.get<PublicStore[]>("/api/stores/public", { signal });
    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu danh sách nhà vườn không hợp lệ.");
    }
    return data;
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      logger.error("Lỗi khi tải danh sách nhà vườn công khai:", err);
    }
    throw err;
  }
}

export const PublicStoreService = {
  getPublicStores
};
