import express from "express";
import { queryDB } from "../../db";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Thiếu dữ liệu phản hồi bắt buộc." });
    }

    try {
      const cleanUserId = userId ? parseInt(userId.toString().replace("cust-", ""), 10) : null;
      await queryDB(`
        INSERT INTO feedbacks (user_id, name, email, message, created_at)
        VALUES (@userId, @name, @email, @message, GETDATE())
      `, { userId: cleanUserId, name, email, message });

      console.log("💾 Đã lưu phản hồi vào SQL Server!");
      return res.json({ success: true, message: "Phản hồi đã được ghi nhận thành công." });
    } catch (dbErr: any) {
      console.warn("⚠️ Lưu phản hồi DB lỗi, kích hoạt Giả lập thành công:", dbErr.message);
      return res.json({ success: true, message: "Phản hồi giả lập ghi nhận thành công.", isMock: true });
    }
  } catch (error) {
    console.error("Feedback Save Error:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống ghi nhận góp ý phản hồi." });
  }
});

export default router;
