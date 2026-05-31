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
   * Clears security context
   */
  public static async logout(): Promise<void> {
    await this.delay(100);
    localStorage.removeItem(this.STORAGE_KEY);
  }

}

