import { User } from "../types";
import { HttpClient } from "./httpClient";
import type { StoreResponse } from "./adminStoreService";
import { storage } from "../utils/storage";
import { logger } from "../utils/logger";

export class AuthService {
  private static STORAGE_KEY = "greenlife_current_user";

  private static mapUserResponseToUser(data: any): User {
    const roleMap: Record<string, "customer" | "store" | "admin"> = {
      "ADMIN": "admin",
      "STORE_OWNER": "store",
      "CUSTOMER": "customer"
    };
    const role = roleMap[data.role || ""] || "customer";

    return {
      id: String(data.id),
      name: data.fullName || "",
      email: data.email || "",
      avatar: data.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: role,
      carbonCredits: 100,
      co2SavedKg: 0.0,
      registeredDate: new Date().toISOString().split("T")[0],
      savedProductIds: [],
      is_seller: role === "store" || data.role === "STORE_OWNER",
      shop_name: role === "store" ? data.fullName : undefined,
      shop_email: role === "store" ? data.email : undefined,
      shop_phone: role === "store" ? data.phone : undefined,
      shop_address: role === "store" ? data.address : undefined,
    };
  }

  /**
   * Retrieves currently logged-in user and fetches latest profile from server
   */
  public static async getCurrentUser(): Promise<User | null> {
    const parsed = storage.getItem<any>(this.STORAGE_KEY);
    if (!parsed) return null;

    try {
      const token = parsed.token;
      if (!token) return null;

      const data = await HttpClient.get("/api/auth/me", { skipAuthRedirect: true });
      const mappedUser = this.mapUserResponseToUser(data);

      // Save the updated info back to storage
      storage.setItem(this.STORAGE_KEY, {
        token: token,
        user: mappedUser
      });

      return mappedUser;
    } catch (err: any) {
      // Phase 4-J7: Do NOT call logout() here on 401 — that creates a
      // /api/auth/me 401 → /api/auth/logout 401 loop.
      // HttpClient already cleared local storage on 401; just return null.
      logger.warn("getCurrentUser failed (session may have expired):", err?.message);
      return null;
    }
  }

  /**
   * Authenticates credentials and stores JWT + user info
   */
  public static async login(email: string, password = ""): Promise<User> {
    const data = await HttpClient.post("/api/auth/login", { email, password }, { credentials: "include" });

    if (data.accessToken && data.user) {
      const mappedUser = this.mapUserResponseToUser(data.user);
      storage.setItem(this.STORAGE_KEY, {
        token: data.accessToken,
        user: mappedUser
      });
      // Phase 4-J7: Reset the refresh-failed guard so the new session can refresh.
      HttpClient.resetRefreshFailedFlag();
      return mappedUser;
    }

    throw new Error("Không có thông tin đăng nhập trả về từ hệ thống.");
  }

  /**
   * Performs Google authentication via Google Sign-In ID Token
   */
  public static async googleLogin(idToken: string): Promise<User> {
    const data = await HttpClient.post("/api/auth/google", { idToken }, { credentials: "include" });

    if (data.accessToken && data.user) {
      const mappedUser = this.mapUserResponseToUser(data.user);
      storage.setItem(this.STORAGE_KEY, {
        token: data.accessToken,
        user: mappedUser
      });
      // Phase 4-J7: Reset the refresh-failed guard so the new session can refresh.
      HttpClient.resetRefreshFailedFlag();
      return mappedUser;
    }
    throw new Error("Đăng nhập bằng Google thất bại.");
  }

  /**
   * Refreshes JWT access token
   */
  public static async refreshToken(): Promise<string> {
    try {
      const data = await HttpClient.post("/api/auth/refresh", {}, { credentials: "include", skipAuthRedirect: true });
      if (data.accessToken) {
        const parsed = storage.getItem<any>(this.STORAGE_KEY) || {};
        const mappedUser = data.user ? this.mapUserResponseToUser(data.user) : parsed.user;

        storage.setItem(this.STORAGE_KEY, {
          token: data.accessToken,
          user: mappedUser
        });
        return data.accessToken;
      }
      throw new Error("Không có token mới từ hệ thống.");
    } catch (err) {
      storage.removeItem(this.STORAGE_KEY);
      throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  /**
   * Clears security context
   */
  public static async logout(): Promise<void> {
    // Phase 4-J7: Only call the server logout endpoint if we have a token.
    // Calling /logout without a token returns 401, which previously triggered
    // another logout() call — a recursive loop.
    const token = this.getAccessToken();
    if (token) {
      try {
        await HttpClient.post("/api/auth/logout", {}, { credentials: "include", skipAuthRedirect: true });
      } catch (err) {
        logger.warn("Yêu cầu đăng xuất thất bại:", err);
      }
    }
    storage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Register a new user (request)
   */
  public static async registerRequest(
    name: string,
    email: string,
    role: "customer" | "store" | "admin",
    password = ""
  ): Promise<{ success: boolean; message: string }> {
    const backendRole = role === "store" ? "STORE_OWNER" : "CUSTOMER";
    const data = await HttpClient.post("/api/auth/register", {
      fullName: name,
      email: email,
      password: password,
      phone: "",
      address: "",
      role: backendRole
    });

    return {
      success: true,
      message: data.message || "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP."
    };
  }

  /**
   * Verify OTP to complete registration
   */
  public static async verifyRegistrationOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/auth/verify-email", { email, otp: code });
    return {
      success: true,
      message: data.message || "Xác thực OTP thành công!"
    };
  }

  /**
   * General OTP verification — alias for verifyRegistrationOTP.
   * Maps to POST /api/auth/verify-email.
   */
  public static async verifyOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/auth/verify-email", { email, otp: code });
    return {
      success: true,
      message: data.message || "Xác thực OTP thành công!"
    };
  }

  /**
   * Sends OTP to the specified email (for forgot-password or verify)
   */
  public static async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/auth/resend-otp", { email });
    return {
      success: true,
      message: data.message || "Gửi OTP thành công!"
    };
  }

  /**
   * Sends OTP for seller registration
   */
  public static async sendSellerOtp(email: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/stores/otp/send", { email });
    return {
      success: true,
      message: data.message || "Gửi OTP thành công!"
    };
  }

  /**
   * Verifies OTP for seller registration
   */
  public static async verifySellerOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/stores/otp/verify", { email, otp: code });
    return {
      success: true,
      message: data.message || "Xác thực OTP thành công!"
    };
  }

  /**
   * Authenticated multipart upload for seller KYC document
   */
  public static async uploadKycDocument(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const data = await HttpClient.post<{ url: string }>("/api/store/profile/kyc/upload", formData);
    return data.url;
  }

  /**
   * Request forgot password OTP
   */
  public static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/auth/forgot-password", { email });
    return {
      success: true,
      message: data.message || "Gửi OTP đặt lại mật khẩu thành công!"
    };
  }

  /**
   * Verify forgot password OTP and get reset token
   */
  public static async verifyResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    const data = await HttpClient.post<{ resetToken: string }>("/api/auth/verify-reset-otp", { email, otp });
    return data;
  }

  /**
   * Reset password using JWT reset token
   */
  public static async resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const data = await HttpClient.post("/api/auth/reset-password", { resetToken, newPassword });
    return {
      success: true,
      message: data.message || "Đặt lại mật khẩu thành công!"
    };
  }

  /**
   * Adds address for user
   */
  public static async addAddress(userId: string, address: {
    fullname: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detailAddress: string;
    isDefault: boolean;
    isPickup: boolean;
    type: "home" | "office";
  }): Promise<{ success: boolean; addressId: number; address: any }> {
    const data = await HttpClient.post("/api/addresses", {
      fullname: address.fullname,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      detailAddress: address.detailAddress,
      isDefault: address.isDefault,
      isPickup: address.isPickup,
      type: (address.type || "home").toUpperCase()
    });

    return {
      success: true,
      addressId: data.id,
      address: data
    };
  }

  public static async registerSeller(userId: string, details: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    description?: string;
    logoUrl?: string;
    verificationDocument?: string;
    shopEmail?: string;
    businessType?: string;
    cccdFrontUrl?: string;
    cccdBackUrl?: string;
    businessEvidenceUrls?: string[];
  }): Promise<{ user: User; store: StoreResponse }> {
    const data = await HttpClient.post<StoreResponse>("/api/stores/register", {
      name: details.name,
      phone: details.phone,
      city: details.city,
      district: details.district,
      address: details.address,
      description: details.description || "",
      logoUrl: details.logoUrl || "",
      verificationDocument: details.verificationDocument || "",
      shopEmail: details.shopEmail || "",
      businessType: details.businessType || "PHYSICAL_STORE",
      cccdFrontUrl: details.cccdFrontUrl || "",
      cccdBackUrl: details.cccdBackUrl || "",
      businessEvidenceUrls: details.businessEvidenceUrls || []
    });

    const updatedUser = await this.getCurrentUser();
    if (updatedUser) {
      return { user: updatedUser, store: data };
    }
    throw new Error("Không thể tải lại thông tin người dùng.");
  }

  public static getAccessToken(): string | null {
    const parsed = storage.getItem<any>(this.STORAGE_KEY);
    if (!parsed) return null;
    return parsed.token || null;
  }

  public static setAccessToken(token: string): void {
    const parsed = storage.getItem<any>(this.STORAGE_KEY) || {};
    storage.setItem(this.STORAGE_KEY, {
      ...parsed,
      token: token
    });
  }
}
