import { HttpClient } from "./httpClient";

export interface AdminLoginAuditResponse {
  id: number;
  userId: number | null;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  failureReason: string | null;
  timestamp: string;
}

export interface PaginatedLoginAudits {
  content: AdminLoginAuditResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const AdminSecurityService = {
  async getAllLoginAudits(page = 0, size = 20, signal?: AbortSignal): Promise<PaginatedLoginAudits> {
    return HttpClient.get(`/api/admin/security/login-audits?page=${page}&size=${size}`, { signal });
  },

  async getUserLoginAudits(userId: number, page = 0, size = 20, signal?: AbortSignal): Promise<PaginatedLoginAudits> {
    return HttpClient.get(`/api/admin/security/login-audits/${userId}?page=${page}&size=${size}`, { signal });
  },

  async getFailedLoginAudits(page = 0, size = 20, signal?: AbortSignal): Promise<PaginatedLoginAudits> {
    return HttpClient.get(`/api/admin/security/failed-logins?page=${page}&size=${size}`, { signal });
  }
};

export default AdminSecurityService;
