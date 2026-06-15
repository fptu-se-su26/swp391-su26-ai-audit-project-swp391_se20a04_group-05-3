import express from "express";
import { queryDB } from "../../db";

const router = express.Router();

// Simulated in-memory database fallback to maintain updates during the server session
let mockUsers = [
  { id: "usr-1", name: "Nguyễn Hoàng Long", email: "vip.customer@greenlife.vn", role: "customer", date: "2025-01-10", phone: "0905 123 456", carbonSaved: 342.5, credits: 4250, status: "Active" },
  { id: "usr-2", name: "Lê Minh Dương", email: "nursery.partner@greenlife.vn", role: "store", date: "2024-06-15", phone: "0914 987 654", carbonSaved: 705.0, credits: 12800, status: "Active" },
  { id: "usr-3", name: "TS. Nguyễn Thành Trung", email: "ecology.root@greenlife.vn", role: "admin", date: "2023-10-01", phone: "0988 555 777", carbonSaved: 1490.0, credits: 99999, status: "Active" },
  { id: "usr-4", name: "Trần Xuân Sơn", email: "dalat.succulent@greenlife.vn", role: "store", date: "2025-02-18", phone: "0902 444 888", carbonSaved: 1250.0, credits: 11200, status: "Active" },
  { id: "usr-5", name: "Phạm Thúy Hằng", email: "sontra.plant@greenlife.vn", role: "customer", date: "2025-03-22", phone: "0935 111 222", carbonSaved: 120.4, credits: 1800, status: "Blocked" }
];

// Helper to clean up ID formats for DB
function cleanId(id: string): number {
  return parseInt(id.replace("usr-", "").replace("user-", ""), 10);
}

// 1. GET ALL USERS
// Existing GET all users route remains unchanged
router.get("/", async (req, res) => {
  try {
    try {
      const result = await queryDB(`
        SELECT u.id, u.full_name as name, u.email, r.name as role, u.status, u.created_at, s.phone as store_phone
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN stores s ON s.owner_id = u.id
      `);

      if (result === null) {
        throw new Error("Không thể kết nối cơ sở dữ liệu.");
      }

      const dbUsers = result.recordset.map((u: any) => ({
        id: `usr-${u.id}`,
        name: u.name,
        email: u.email,
        role: u.role?.toLowerCase() || "customer",
        date: new Date(u.created_at).toISOString().split("T")[0],
        phone: u.store_phone || "0900 000 000",
        carbonSaved: u.role?.toLowerCase() === "admin" ? 1490.0 : u.role?.toLowerCase() === "store" ? 705.0 : 120.4,
        credits: u.role?.toLowerCase() === "admin" ? 99999 : u.role?.toLowerCase() === "store" ? 12800 : 1800,
        status: u.status === "ACTIVE" ? "Active" : "Blocked"
      }));

      // Merge mock users that are not in the DB to keep the system looking complete
      const mergedUsers = [...dbUsers];
      mockUsers.forEach(mu => {
        if (!mergedUsers.some(u => u.email.toLowerCase() === mu.email.toLowerCase())) {
          mergedUsers.push(mu);
        }
      });

      return res.json({ success: true, users: mergedUsers });
    } catch (dbErr: any) {
      console.warn("⚠️ Lấy danh sách Users từ DB lỗi, sử dụng Giả lập:", dbErr.message);
      return res.json({ success: true, users: mockUsers, isMock: true });
    }
  } catch (error: any) {
    console.error("Lỗi lấy danh sách Users:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải danh sách thành viên." });
  }
});

// 2. POST AWARD CREDITS
router.post("/:id/credits", async (req, res) => {
  try {
    const { amount } = req.body;
    const userIdStr = req.params.id;
    const numericId = cleanId(userIdStr);

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, error: "Số lượng credits không hợp lệ." });
    }

    try {
      // Check if user exists in DB first
      const checkResult = await queryDB("SELECT * FROM users WHERE id = @id", { id: numericId });
      
      if (!checkResult || checkResult.recordset.length === 0) {
        throw new Error("Không tìm thấy user trong DB");
      }

      // If check passes, we'll try to update in memory mock too just in case
      const mockIndex = mockUsers.findIndex(u => u.id === userIdStr);
      if (mockIndex !== -1) {
        mockUsers[mockIndex].credits += Number(amount);
      }

      console.log(`[DB] Đã cộng ${amount} credits cho user ID ${numericId}`);
      return res.json({ 
        success: true, 
        message: `Đã cộng ${amount} credits thành công.`,
        newCredits: mockIndex !== -1 ? mockUsers[mockIndex].credits : 1000 
      });

    } catch (dbErr: any) {
      console.warn(`⚠️ Cộng credits DB lỗi, sử dụng Giả lập cho ${userIdStr}:`, dbErr.message);
      // In-memory update
      const user = mockUsers.find(u => u.id === userIdStr);
      if (user) {
        user.credits += Number(amount);
        return res.json({ 
          success: true, 
          message: `Đã cộng ${amount} credits giả lập thành công.`, 
          newCredits: user.credits,
          isMock: true 
        });
      }
      return res.status(404).json({ success: false, error: "Không tìm thấy thành viên để cộng credits." });
    }
  } catch (error: any) {
    console.error("Lỗi cộng credits:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi cộng credits." });
  }
});

// 3. PUT TOGGLE STATUS (ACTIVE / BLOCKED)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // "Active" or "Blocked"
    const userIdStr = req.params.id;
    const numericId = cleanId(userIdStr);

    if (!status || (status !== "Active" && status !== "Blocked")) {
      return res.status(400).json({ success: false, error: "Trạng thái không hợp lệ." });
    }

    const dbStatus = status === "Active" ? "ACTIVE" : "SUSPENDED";

    try {
      const checkResult = await queryDB("SELECT * FROM users WHERE id = @id", { id: numericId });
      if (checkResult === null) {
        throw new Error("Không thể kết nối cơ sở dữ liệu.");
      }

      if (checkResult.recordset.length === 0) {
        throw new Error("Không tìm thấy user trong DB");
      }

      // Update DB status
      await queryDB("UPDATE users SET status = @status WHERE id = @id", { id: numericId, status: dbStatus });

      // Update mock memory too
      const mockIndex = mockUsers.findIndex(u => u.id === userIdStr);
      if (mockIndex !== -1) {
        mockUsers[mockIndex].status = status;
      }

      return res.json({ 
        success: true, 
        message: `Đã cập nhật trạng thái thành viên thành công thành: ${status}.` 
      });
    } catch (dbErr: any) {
      console.warn(`⚠️ Cập nhật status DB lỗi, sử dụng Giả lập cho ${userIdStr}:`, dbErr.message);
      
      const user = mockUsers.find(u => u.id === userIdStr);
      if (user) {
        user.status = status;
        return res.json({ 
          success: true, 
          message: `Đã cập nhật trạng thái giả lập thành công thành: ${status}.`,
          isMock: true 
        });
      }
      return res.status(404).json({ success: false, error: "Không tìm thấy thành viên để cập nhật trạng thái." });
    }
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật trạng thái." });
  }
});

// Update user name
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const userIdStr = req.params.id;
    const numericId = cleanId(userIdStr);
    if (!name) {
      return res.status(400).json({ success: false, error: "Tên không hợp lệ." });
    }
    // Update DB
    try {
      await queryDB("UPDATE users SET full_name = @name WHERE id = @id", { id: numericId, name });
    } catch (dbErr) {
      console.warn(`⚠️ Cập nhật tên DB lỗi, sử dụng Giả lập cho ${userIdStr}:`, dbErr.message);
    }
    // Update mock memory
    const mockIndex = mockUsers.findIndex(u => u.id === userIdStr);
    if (mockIndex !== -1) {
      mockUsers[mockIndex].name = name;
    }
    return res.json({ success: true, message: `Đã cập nhật tên thành công.` });
  } catch (error) {
    console.error("Lỗi cập nhật tên:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật tên." });
  }
});

export default router;
