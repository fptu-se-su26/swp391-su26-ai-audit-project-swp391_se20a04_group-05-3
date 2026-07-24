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

/**
 * Phase 4-J7: Auth request loop fix.
 *
 * Root causes of the previous loop:
 *   1. A 401 on any non-auth endpoint triggered AuthService.logout()
 *      (which calls POST /api/auth/logout), then after that the refresh
 *      path was also attempted — creating a /logout → /refresh → /logout cycle.
 *   2. AuthService.logout() in getCurrentUser() on 401 triggered another /logout.
 *   3. 503 from a DB-busy backend was retried on POST endpoints.
 *
 * Fixed behavior:
 *   - 401 on auth endpoints (login/register/google/refresh): clear local state only,
 *     dispatch auth-unauthorized, do NOT call logout (no server round-trip).
 *   - 401 on any other endpoint: attempt ONE refresh (if token exists and no
 *     previous refresh failure this session). On refresh failure: clear local
 *     state only (no /logout call), dispatch auth-unauthorized.
 *   - refreshPromise provides single-flight deduplication.
 *   - 503/502/504 retried only on idempotent GET/HEAD requests.
 */
export class HttpClient {
  private static DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

  private static refreshPromise: Promise<string> | null = null;

  // Phase 4-J7: Prevents a second /refresh attempt after the first one fails
  // within the same browser session. Cleared on successful login.
  private static refreshFailed = false;

  /** Called by AuthService after a successful login to reset the refresh-failed guard. */
  public static resetRefreshFailedFlag(): void {
    HttpClient.refreshFailed = false;
  }

  public static async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.DEFAULT_TIMEOUT, retry = 2, signal, ...fetchOpts } = options;

    const method = (fetchOpts.method || "GET").toUpperCase();
    // Only retry idempotent methods. Do NOT retry POST/PUT/PATCH/DELETE on 503.
    const canRetry = method === "GET" || method === "HEAD";

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

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

          if (status === 401) {
            // Phase 4-J7: Classify whether this is an auth endpoint.
            // Auth endpoints that produce 401 mean credentials are invalid —
            // do NOT call /logout (that would cause a loop) and do NOT attempt refresh.
            const isAuthEndpoint =
              url.includes("/api/auth/refresh") ||
              url.includes("/api/auth/login") ||
              url.includes("/api/auth/google") ||
              url.includes("/api/auth/register") ||
              url.includes("/api/auth/logout") ||
              url.includes("/api/auth/me");

            if (isAuthEndpoint) {
              // Just clear local storage — no server logout call.
              storage.removeItem("greenlife_current_user");
              if (url.includes("/api/auth/refresh") || url.includes("/api/auth/me")) {
                window.dispatchEvent(new CustomEvent("auth-unauthorized"));
              }
              throw new UnauthorizedError(normalizedMessage);
            }

            // Phase 4-J7: Do NOT attempt refresh if:
            //   (a) there is no token (user is not logged in), or
            //   (b) a refresh already failed this session (prevents infinite retry).
            const currentToken = AuthService.getAccessToken();
            if (!currentToken || HttpClient.refreshFailed) {
              storage.removeItem("greenlife_current_user");
              window.dispatchEvent(new CustomEvent("auth-unauthorized"));
              throw new UnauthorizedError(normalizedMessage);
            }

            // Attempt token refresh — single-flight via refreshPromise
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
                    // Mark refresh as failed for this session — no more retries.
                    HttpClient.refreshFailed = true;
                    // Clear local state only — do NOT call /logout (that creates a loop).
                    storage.removeItem("greenlife_current_user");
                    window.dispatchEvent(new CustomEvent("auth-unauthorized"));
                    throw err;
                  } finally {
                    HttpClient.refreshPromise = null;
                  }
                })();
              }

              await HttpClient.refreshPromise;
              // Retry original request once with new token
              return await HttpClient.request<T>(url, options);
            } catch {
              throw new UnauthorizedError(normalizedMessage);
            }
          }

          // Phase 4-J7: Retry only GET/HEAD on 502/503/504.
          // Previously 503 was also retried on POSTs — this caused a storm when
          // the DB was busy (e.g. login was retried 3x during pool exhaustion).
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

        if (err.name === "AbortError") {
          if (signal && signal.aborted) {
            throw err;
          } else {
            if (canRetry && attempt < retry) {
              attempt++;
              const delay = attempt === 1 ? 1000 : 2000;
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw new Error("Yêu cầu đã hết thời gian chờ");
          }
        }

        // Re-throw UnauthorizedError immediately — no retry
        if (err instanceof UnauthorizedError) {
          throw err;
        }

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

  public static async getBlob(url: string, options?: RequestOptions): Promise<Blob> {
    const token = AuthService.getAccessToken();
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> || {}),
    };
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    if (!response.ok) {
      throw new Error(`Tải tệp thất bại: ${response.status}`);
    }
    return response.blob();
  }
}

export default HttpClient;
