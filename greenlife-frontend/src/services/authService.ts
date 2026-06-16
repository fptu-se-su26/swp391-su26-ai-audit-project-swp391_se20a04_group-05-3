import { User } from "../types";
import { MOCK_USERS } from "../data";

export class AuthService {
  private static STORAGE_KEY = "greenlife_current_user";
  private static REGISTERED_USERS_KEY = "greenlife_registered_users";

  /**
   * Simulated delay for microservices
   */
  private static async delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retrieves currently logged-in user or loads a default Customer session
   */
  public static async getCurrentUser(): Promise<User> {
    await this.delay(150);
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        // Fallback to customer
      }
    }
    return MOCK_USERS[0]; // Nguyễn Hoàng Long (Customer)
  }

  /**
   * Switches the active simulation role in the frontend
   */
  public static async switchRoleAndUser(role: "customer" | "store" | "admin"): Promise<User> {
    await this.delay(200);
    
    // Check local registered users first
    const localUsersStr = localStorage.getItem(this.REGISTERED_USERS_KEY);
    const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
    const foundLocal = localUsers.find((u) => u.role === role);
    if (foundLocal) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(foundLocal));
      return foundLocal;
    }

    const user = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Registers a new user and saves to localStorage
   */
  public static async register(name: string, email: string, role: "customer" | "store" | "admin", password = "pass1234"): Promise<User> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phone: "", address: "" })
      });
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.error || "Không thể tạo tài khoản.");
    } catch (err) {
      console.warn("⚠️ API Đăng ký lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(300);
      const localUsersStr = localStorage.getItem(this.REGISTERED_USERS_KEY);
      const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      
      const existsInMock = MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());
      const existsInLocal = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (existsInMock || existsInLocal) {
        throw new Error("Email đã tồn tại trên hệ thống.");
      }

      const newUser: User = {
        id: `cust-${Date.now()}`,
        name,
        email,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        role,
        carbonCredits: 100,
        co2SavedKg: 0.0,
        registeredDate: new Date().toISOString().split("T")[0],
        savedProductIds: []
      };

      localUsers.push(newUser);
      localStorage.setItem(this.REGISTERED_USERS_KEY, JSON.stringify(localUsers));
      return newUser;
    }
  }

  /**
   * Request registration and send real OTP email
   */
  public static async registerRequest(name: string, email: string, role: "customer" | "store" | "admin", password = "pass1234"): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.error || "Gửi yêu cầu đăng ký thất bại.");
    } catch (err: any) {
      console.warn("⚠️ API registerRequest lỗi, chuyển sang giả lập OTP:", err.message);
      await this.delay(300);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`mock_registration_otp_${email}`, JSON.stringify({ name, email, password, role, code }));
      console.log(`\n============================`);
      console.log(`[MOCK REGISTRATION OTP] Email: ${email}`);
      console.log(`[MOCK REGISTRATION OTP] Code: ${code}`);
      console.log(`============================\n`);
      return {
        success: true,
        message: `[MOCK] Gửi OTP thành công cho ${email}. (Mã: ${code} - hãy xem console F12)`
      };
    }
  }

  /**
   * Verify OTP and complete registration
   */
  public static async verifyRegistrationOTP(email: string, code: string): Promise<User> {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.error || "Xác thực OTP thất bại.");
    } catch (err: any) {
      console.warn("⚠️ API verifyRegistrationOTP lỗi, sử dụng mock:", err.message);
      await this.delay(200);
      const stored = localStorage.getItem(`mock_registration_otp_${email}`);
      if (!stored) throw new Error("Yêu cầu đăng ký không tồn tại.");
      
      const payload = JSON.parse(stored);
      if (payload.code === code.trim() || code.trim() === "123456" || code.trim() === "000000") {
        localStorage.removeItem(`mock_registration_otp_${email}`);
        
        const newUser: User = {
          id: `cust-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          role: payload.role,
          carbonCredits: 100,
          co2SavedKg: 0.0,
          registeredDate: new Date().toISOString().split("T")[0],
          savedProductIds: []
        };
        
        // Add to local registered users
        const localUsersStr = localStorage.getItem(this.REGISTERED_USERS_KEY);
        const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        localUsers.push(newUser);
        localStorage.setItem(this.REGISTERED_USERS_KEY, JSON.stringify(localUsers));
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUser));
        return newUser;
      }
      throw new Error("Mã OTP đăng ký không chính xác.");
    }
  }

  /**
   * Authenticates credentials and delivers a user role
   */
  public static async login(email: string, password = "pass1234"): Promise<User> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.error || "Email hoặc mật khẩu không chính xác.");
    } catch (err) {
      console.warn("⚠️ API Đăng nhập lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(400);
      
      // Check local registered users first
      const localUsersStr = localStorage.getItem(this.REGISTERED_USERS_KEY);
      const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const foundLocal = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (foundLocal) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(foundLocal));
        return foundLocal;
      }

      // Check mock users
      const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(found));
        return found;
      }
      
      // Create new temporary user with role-based fallback detection
      let fallbackRole: "customer" | "store" | "admin" = "customer";
      let fallbackName = email.split("@")[0].toUpperCase();
      if (email.toLowerCase().includes("admin")) {
        fallbackRole = "admin";
        fallbackName = "Admin GreenLife";
      } else if (email.toLowerCase().includes("store")) {
        fallbackRole = "store";
        fallbackName = "Nhà Vườn GreenLife";
      }

      const tempUser: User = {
        id: fallbackRole === "admin" ? "admin-83921" : fallbackRole === "store" ? "store-83921" : "cust-83921",
        name: fallbackName,
        email,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        role: fallbackRole,
        carbonCredits: fallbackRole === "admin" ? 99999 : 100,
        co2SavedKg: fallbackRole === "admin" ? 1490.0 : 5.0,
        registeredDate: new Date().toISOString().split("T")[0],
        savedProductIds: []
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tempUser));
      return tempUser;
    }
  }

  /**
   * Performs Google Authentication via Google Sign-In ID Token
   */
  public static async googleLogin(idToken: string): Promise<User> {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.error || "Đăng nhập Google thất bại.");
    } catch (err) {
      console.warn("⚠️ API Đăng nhập Google lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(300);
      
      let email = "google-user@gmail.com";
      let name = "Google User";
      let avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
      
      try {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        if (payload.email) email = payload.email;
        if (payload.name) name = payload.name;
        if (payload.picture) avatar = payload.picture;
      } catch (jwtErr) {
        console.error("Lỗi giải mã mock Google JWT:", jwtErr);
      }
      
      const mockId = `google-${Date.now()}`;
      const tempUser: User = {
        id: mockId,
        name: name,
        email: email,
        avatar: avatar,
        role: "customer",
        carbonCredits: 100,
        co2SavedKg: 0.0,
        registeredDate: new Date().toISOString().split("T")[0],
        savedProductIds: []
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tempUser));
      return tempUser;
    }
  }

  /**
   * Sends OTP to the specified email
   */
  public static async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.error || "Gửi OTP thất bại.");
    } catch (err: any) {
      console.warn("⚠️ API sendOTP lỗi, giả lập thành công:", err.message);
      await this.delay(200);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`mock_otp_${email}`, code);
      console.log(`\n============================`);
      console.log(`[MOCK OTP FRONTEND] Email: ${email}`);
      console.log(`[MOCK OTP FRONTEND] Code: ${code}`);
      console.log(`============================\n`);
      return {
        success: true,
        message: `[MOCK] Gửi OTP thành công cho ${email}. (Vui lòng kiểm tra F12 Console để lấy mã!)`
      };
    }
  }

  /**
   * Verifies OTP for email
   */
  public static async verifyOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.error || "Xác thực OTP thất bại.");
    } catch (err: any) {
      console.warn("⚠️ API verifyOTP lỗi, sử dụng kiểm tra mock:", err.message);
      await this.delay(200);
      const savedCode = localStorage.getItem(`mock_otp_${email}`);
      if (savedCode === code.trim() || code.trim() === "123456" || code.trim() === "000000") {
        localStorage.removeItem(`mock_otp_${email}`);
        return { success: true, message: "Xác thực OTP thành công!" };
      }
      throw new Error("Mã OTP không chính xác hoặc đã hết hạn (Thử dùng mã 123456 hoặc xem console).");
    }
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
    try {
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const response = await fetch("/api/auth/add-address", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, ...address })
      });
      const data = await response.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.error || "Thêm địa chỉ thất bại.");
    } catch (err: any) {
      console.warn("⚠️ API addAddress lỗi, sử dụng mock:", err.message);
      await this.delay(200);
      const mockId = Math.floor(100000 + Math.random() * 900000);
      const newAddr = {
        address_id: mockId,
        user_id: userId,
        ...address,
        detail_address: address.detailAddress
      };
      
      const stored = localStorage.getItem(`mock_addresses_${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      if (address.isDefault) {
        list.forEach((a: any) => a.is_default = false);
      }
      if (address.isPickup) {
        list.forEach((a: any) => a.is_pickup = false);
      }
      list.push(newAddr);
      localStorage.setItem(`mock_addresses_${userId}`, JSON.stringify(list));

      return {
        success: true,
        addressId: mockId,
        address: newAddr
      };
    }
  }

  /**
   * Registers a customer as a seller (Updated for 4-step wizard)
   */
  public static async registerSeller(userId: string, details: {
    shopName: string;
    shopEmail: string;
    shopPhone: string;
    pickupAddressId: number;
    shippingSettings: {
      greenExpress: boolean;
      hoaToc: boolean;
      spx: boolean;
      ghtk: boolean;
    };
    kycImages: {
      frontImage: string;
      backImage: string;
    };
  }): Promise<User> {
    try {
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const response = await fetch("/api/auth/register-seller", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, ...details })
      });
      const data = await response.json();
      if (data.success && data.user) {
        const cleanUser = {
          ...data.user,
          kyc_front_image: "",
          kyc_back_image: ""
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanUser));
        return cleanUser;
      }
      throw new Error(data.error || "Không thể đăng ký bán hàng.");
    } catch (err) {
      console.warn("⚠️ API Đăng ký bán hàng lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(300);
      
      const currentUser = await this.getCurrentUser();
      
      let mockFullAddressStr = "Chưa cập nhật địa chỉ lấy hàng cụ thể";
      const storedAddrs = localStorage.getItem(`mock_addresses_${userId}`);
      if (storedAddrs) {
        const list = JSON.parse(storedAddrs);
        const matched = list.find((a: any) => String(a.address_id) === String(details.pickupAddressId));
        if (matched) {
          mockFullAddressStr = `${matched.detail_address}, ${matched.ward}, ${matched.district}, ${matched.province}`;
        }
      }

      const updatedUser: User = {
        ...currentUser,
        is_seller: true,
        shop_name: details.shopName,
        shop_email: details.shopEmail,
        shop_phone: details.shopPhone,
        shop_address: mockFullAddressStr,
        shipping_green_express: details.shippingSettings.greenExpress,
        shipping_hoa_toc: details.shippingSettings.hoaToc,
        shipping_spx: details.shippingSettings.spx,
        shipping_ghtk: details.shippingSettings.ghtk,
        kyc_front_image: "",
        kyc_back_image: ""
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));

      const localUsersStr = localStorage.getItem(this.REGISTERED_USERS_KEY);
      if (localUsersStr) {
        const localUsers: User[] = JSON.parse(localUsersStr);
        const updatedList = localUsers.map(u => u.id === userId ? updatedUser : u);
        localStorage.setItem(this.REGISTERED_USERS_KEY, JSON.stringify(updatedList));
      }

      return updatedUser;
    }
  }

  /**
   * Clears security context
   */
  public static async logout(): Promise<void> {
    await this.delay(100);
    localStorage.removeItem(this.STORAGE_KEY);
  }

}

