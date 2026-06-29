import { AuthService } from "./authService";
import { storage } from "../utils/storage";
import { API_BASE_URL, DEFAULT_TIMEOUT } from "../config/env";

export class UnauthorizedError extends Error {
  constructor(message = "Phiên đăng nhập đã hết hạn") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  skipAuthRedirect?: boolean;
}

export class HttpClient {
  private static DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

  private static refreshPromise: Promise<string> | null = null;

  public static async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.DEFAULT_TIMEOUT, retry = 2, signal, ...fetchOpts } = options;

    const method = (fetchOpts.method || "GET").toUpperCase();
    const canRetry = method === "GET" || method === "HEAD";

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge signals
      const onAbort = () => {
        controller.abort();
      };
      
      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener("abort", onAbort);
        }
      }

      const headers: Record<string, string> = {
        ...(fetchOpts.headers as Record<string, string> || {}),
      };

      // 1. Automatic Authorization header injection
      const token = AuthService.getAccessToken();
      if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 2. Add Content-Type header if body is not FormData
      const isFormData = fetchOpts.body instanceof FormData;
      if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      try {
        const requestUrl = (url.startsWith("/") && !url.startsWith("//")) ? `${API_BASE_URL}${url}` : url;
        const response = await fetch(requestUrl, {
          ...fetchOpts,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }

        if (!response.ok) {
          const status = response.status;
          const text = await response.text();
          let message = "";
          try {
            const parsed = JSON.parse(text);
            message = parsed.message || parsed.error;
          } catch {}

          // Error Normalization Mapping
          let normalizedMessage = message;
          if (!normalizedMessage) {
            if (status === 400) normalizedMessage = "Yêu cầu không hợp lệ";
            else if (status === 401) normalizedMessage = "Phiên đăng nhập đã hết hạn";
            else if (status === 403) normalizedMessage = "Bạn không có quyền thực hiện thao tác này";
            else if (status === 404) normalizedMessage = "Không tìm thấy dữ liệu";
            else if (status === 408) normalizedMessage = "Yêu cầu đã hết thời gian chờ";
            else if (status === 429) normalizedMessage = "Quá nhiều yêu cầu, vui lòng thử lại sau";
            else if (status === 500) normalizedMessage = "Máy chủ đang gặp sự cố";
            else normalizedMessage = `Yêu cầu thất bại với mã lỗi ${status}`;
          }

          // On HTTP 401: call AuthService.logout() and throw UnauthorizedError, DO NOT redirect.
          if (status === 401) {
            const isAuthEndpoint =
              url.includes("/api/auth/refresh") ||
              url.includes("/api/auth/login") ||
              url.includes("/api/auth/google") ||
              url.includes("/api/auth/register");

            if (isAuthEndpoint) {
              if (url !== "/api/auth/logout" && url !== "/api/auth/me") {
                await AuthService.logout();
              } else {
                storage.removeItem("greenlife_current_user");
              }
              throw new UnauthorizedError(normalizedMessage);
            }

            // Attempt to refresh token
            try {
              if (!HttpClient.refreshPromise) {
                HttpClient.refreshPromise = (async () => {
                  try {
                    const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
                    const res = await fetch(refreshUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      credentials: "include",
                    });
                    if (!res.ok) {
                      throw new Error("Failed to refresh token");
                    }
                    const data = await res.json();
                    const newToken = data.accessToken;
                    if (!newToken) {
                      throw new Error("No token returned");
                    }
                    AuthService.setAccessToken(newToken);
                    return newToken;
                  } catch (err) {
                    await AuthService.logout();
                    throw err;
                  } finally {
                    HttpClient.refreshPromise = null;
                  }
                })();
              }

              await HttpClient.refreshPromise;
              return await HttpClient.request<T>(url, options);
            } catch (refreshErr) {
              throw new UnauthorizedError(normalizedMessage);
            }
          }

          // Retry logic (502, 503, 504)
          const shouldRetryStatus = [502, 503, 504].includes(status);
          if (canRetry && shouldRetryStatus && attempt < retry) {
            attempt++;
            const delay = attempt === 1 ? 1000 : 2000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new Error(normalizedMessage);
        }

        // Return parsed json or text
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json() as T;
        }
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        lastError = err;

        // Check if aborted by timeout
        if (err.name === "AbortError") {
          if (signal && signal.aborted) {
            // Aborted externally
            throw err;
          } else {
            // It was our timeout controller that aborted the request
            if (canRetry && attempt < retry) {
              attempt++;
              const delay = attempt === 1 ? 1000 : 2000;
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw new Error("Yêu cầu đã hết thời gian chờ");
          }
        }

        // Check for network failure / type error
        const isNetworkError =
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("NetworkError") ||
          err.name === "TypeError";

        if (canRetry && isNetworkError && attempt < retry) {
          attempt++;
          const delay = attempt === 1 ? 1000 : 2000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }

    throw lastError || new Error("Không thể kết nối tới máy chủ");
  }

  public static get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  public static post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public static put<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public static patch<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public static delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export default HttpClient;
