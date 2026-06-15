import express from "express";
import { queryDB } from "../../db";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    try {
      const result = await queryDB("SELECT * FROM articles ORDER BY created_at DESC");
      if (!result || result.recordset.length === 0) {
        throw new Error("Bảng articles rỗng.");
      }

      const articles = result.recordset.map((a: any) => {
        // Map category
        let feCat = "plant-care";
        if (a.category === "basic_care") feCat = "urban-farming";
        else if (a.category === "inspiration") feCat = "eco-living";

        // Image fallbacks
        let img = a.image_url;
        if (img === "article-care.jpg" || !img) {
          img = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&auto=format&fit=crop&q=80";
        }

        return {
          id: `art-${a.id}`,
          title: a.title,
          category: feCat,
          summary: a.content.substring(0, 150) + "...",
          content: a.content,
          image: img,
          date: new Date(a.created_at).toLocaleDateString("vi-VN"),
          readTime: "5 phút đọc",
          author: "Nghệ nhân GreenLife"
        };
      });

      return res.json({ success: true, articles });
    } catch (dbErr: any) {
      console.warn("⚠️ Tải cẩm nang DB lỗi, kích hoạt Mock data:", dbErr.message);
      // Serve direct fallback articles
      const fallbackArticles = [
        {
          id: "art-1",
          title: "Bí quyết pha chế dung dịch tỏi ớt xua đuổi nhện đỏ hiệu quả",
          category: "plant-care",
          summary: "Nhện đỏ là hung thần tàn sát chồi non hồng leo và sen đá. Hướng dẫn chi tiết cách chưng cất sáp tỏi nồng ấm tại ban công giúp quét sạch ổ rệp tự nhiên.",
          content: "Nhện đỏ cắn phá làm suy giảm nghiêm trọng lượng diệp lục quang hợp của cây xanh. Bạn có thể giã nhỏ 3 củ tỏi ta lọc lấy dịch cay pha với 2 lít nước ấm và 5 giọt nước rửa chén hữu cơ làm chất bám dính. Lắc đều rồi phun toàn diện mặt dưới lá hồng non vào lúc tối muộn. Lặp lại chu kỳ 3 ngày 1 lần cho đến khi sạch hẳn ổ nhện.",
          image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&auto=format&fit=crop&q=80",
          date: "24/05/2026",
          readTime: "4 phút đọc",
          author: "Kỹ sư Trần Thành Trung"
        },
        {
          id: "art-2",
          title: "Thiết lập chu trình ánh sáng nhân tạo Solar Sun-Mimic cho chung cư lầu cao",
          category: "urban-farming",
          summary: "Vấn đề thiếu hụt quang năng làm chồi cây cảnh khô héo còi cọc. Giải pháp sử dụng đèn LED quang phổ mặt trời mô phỏng để hồi phục sức khỏe cây trồng.",
          content: "Cây trồng ban công hoặc trong nhà kính chung cư thường gặp tình trạng còi cọc, mất màu xanh mướt do thiếu nắng trực tiếp. Bạn nên lắp đặt đèn LED Sun-Mimic 120W chiếu thẳng trực diện mặt lá với khoảng cách 30-50cm. Bật đèn liên tục 6-8 tiếng vào quang giờ ban ngày để kích thích diệp lục tái tạo diệp khối mạnh mẽ.",
          image: "https://images.unsplash.com/photo-1558603668-6570496b66f8?w=600&auto=format&fit=crop&q=80",
          date: "18/05/2026",
          readTime: "6 phút đọc",
          author: "KTS. Lê Minh Dương"
        }
      ];
      return res.json({ success: true, articles: fallbackArticles, isMock: true });
    }
  } catch (error) {
    console.error("Fetch Articles Error:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải danh mục cẩm nang xanh." });
  }
});

export default router;
