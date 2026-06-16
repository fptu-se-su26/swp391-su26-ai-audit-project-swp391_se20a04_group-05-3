import { User } from "../types";
import { MOCK_USERS } from "../data";

export class AuthService {
  private static STORAGE_KEY = "greenlife_current_user";

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
    const user = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Authenticates credentials and delivers a user role
   */
  public static async login(email: string, password?: string): Promise<User> {
    await this.delay(400);
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(found));
      return found;
    }
    
    // Create new temporary user if not found
    const tempUser: User = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0].toUpperCase(),
      email,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: "customer",
      carbonCredits: 100,
      co2SavedKg: 5.0,
      registeredDate: new Date().toISOString().split("T")[0],
      savedProductIds: []
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tempUser));
    return tempUser;
  }

  /**
   * Clears security context
   */
  public static async logout(): Promise<void> {
    await this.delay(100);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
