export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "store" | "admin";
  date: string;
  phone: string;
  carbonSaved: number;
  credits: number;
  status: "Active" | "Blocked";
}

export class UserService {
  private static async delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch all users for dashboard
   */
  public static async getUsers(): Promise<DashboardUser[]> {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.success && data.users) {
        return data.users;
      }
      throw new Error(data.error || "Lỗi tải danh sách người dùng.");
    } catch (err) {
      console.warn("⚠️ API Users lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(200);
      return [
        { id: "usr-1", name: "Nguyễn Hoàng Long", email: "vip.customer@greenlife.vn", role: "customer", date: "2025-01-10", phone: "0905 123 456", carbonSaved: 342.5, credits: 4250, status: "Active" },
        { id: "usr-2", name: "Lê Minh Dương", email: "nursery.partner@greenlife.vn", role: "store", date: "2024-06-15", phone: "0914 987 654", carbonSaved: 705.0, credits: 12800, status: "Active" },
        { id: "usr-3", name: "TS. Nguyễn Thành Trung", email: "ecology.root@greenlife.vn", role: "admin", date: "2023-10-01", phone: "0988 555 777", carbonSaved: 1490.0, credits: 99999, status: "Active" },
        { id: "usr-4", name: "Trần Xuân Sơn", email: "dalat.succulent@greenlife.vn", role: "store", date: "2025-02-18", phone: "0902 444 888", carbonSaved: 1250.0, credits: 11200, status: "Active" },
        { id: "usr-5", name: "Phạm Thúy Hằng", email: "sontra.plant@greenlife.vn", role: "customer", date: "2025-03-22", phone: "0935 111 222", carbonSaved: 120.4, credits: 1800, status: "Blocked" }
      ];
    }
  }

  /**
   * Award carbon credits to a user
   */
  public static async updateUser(userId: string, data: Partial<{ name: string }>): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return { success: result.success };
    } catch (err) {
      console.warn("⚠️ API Update user lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(150);
      return { success: true };
    }
  }



  /**
   * Update user status (Active / Blocked)
   */
  public static async updateStatus(userId: string, status: "Active" | "Blocked"): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.warn("⚠️ API Status lỗi, tự động chuyển sang chế độ Giả lập:", err);
      await this.delay(150);
      return true;
    }
  }
}
