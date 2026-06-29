import { HttpClient } from "./httpClient";

export interface AdminUserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "LOCKED" | "DISABLED";
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockoutEnd: string | null;
  createdAt: string;
}

export interface PaginatedUsers {
  content: AdminUserResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const AdminUserService = {
  async getUsers(
    params: {
      keyword?: string;
      role?: string;
      status?: string;
      page?: number;
      size?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<PaginatedUsers> {
    const queryParts: string[] = [];
    if (params.keyword) queryParts.push(`keyword=${encodeURIComponent(params.keyword)}`);
    if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.size !== undefined) queryParts.push(`size=${params.size}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return HttpClient.get(`/api/admin/users${queryString}`, { signal });
  },

  async lockUser(id: number, signal?: AbortSignal): Promise<AdminUserResponse> {
    return HttpClient.patch(`/api/admin/users/${id}/lock`, {}, { signal });
  },

  async unlockUser(id: number, signal?: AbortSignal): Promise<AdminUserResponse> {
    return HttpClient.patch(`/api/admin/users/${id}/unlock`, {}, { signal });
  },
};

export default AdminUserService;
