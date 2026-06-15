import express from "express";
import { queryDB } from "../../db";
import { mapAccessoryCategory, mapPlantCategory } from "../utils/helpers";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    try {
      const result = await queryDB("SELECT * FROM products");
      if (!result || result.recordset.length === 0) {
        throw new Error("Không có dữ liệu sản phẩm trong database.");
      }

      // Map SQL schema to Frontend expected format
      const products = result.recordset.map((p: any) => {
        let frontendCategory = "plants";
        if (p.type === "plant") {
          frontendCategory = mapPlantCategory(p.plant_category_id);
        } else {
          frontendCategory = mapAccessoryCategory(p.accessory_category_id);
        }

        // Specific image fallback to match Unsplash assets if default filenames are used
        let img = p.image_url;
        if (img === "kim-tien.jpg") img = "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80";
        else if (img === "luoi-ho.jpg") img = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80";
        else if (img === "trau-ba.jpg") img = "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";
        else if (img === "phat-tai.jpg") img = "https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=600&auto=format&fit=crop&q=80";
        else if (img === "lan-ho-diep.jpg") img = "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600&auto=format&fit=crop&q=80";
        else if (img === "xuong-rong.jpg") img = "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80";
        else if (img === "bang-singapore.jpg") img = "https://images.unsplash.com/photo-1597055181300-e3633a207518?w=600&auto=format&fit=crop&q=80";
        else if (img === "reu-java.jpg") img = "https://images.unsplash.com/photo-1508349682736-239107ccdc68?w=600&auto=format&fit=crop&q=80";
        else if (img === "bonsai-sanh.jpg") img = "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80";
        else if (img === "chuoi-canh.jpg") img = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&auto=format&fit=crop&q=80";
        else if (img.startsWith("chau-") || img.startsWith("binh-") || img.startsWith("keo-") || img.startsWith("xeng-") || img.startsWith("dat-") || img.startsWith("than-") || img.startsWith("phan-")) {
          // General pottery / tool accessories
          img = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80";
        }

        return {
          id: `prod-${p.id}`,
          name: p.name,
          category: frontendCategory,
          price: Number(p.price),
          rating: 4.8,
          image: img,
          description: p.description,
          ecoScore: 92,
          details: ["Canh tác sinh học 100% bản địa", "Đóng gói hữu cơ màng tinh bột", "Không hóa chất bảo quản"],
          specs: {
            "Nguồn gốc": p.type === "plant" ? "Vườn sinh học Hòa Lạc, Hà Nội" : "Xưởng phụ kiện GreenLife",
            "Dấu chân carbon": p.type === "plant" ? "-12.5 kg CO2eq" : "-4.2 kg CO2eq"
          },
          stock: p.stock
        };
      });

      return res.json({ success: true, products });
    } catch (dbErr: any) {
      console.warn("⚠️ Tải danh sách sản phẩm DB lỗi, kích hoạt Mock data:", dbErr.message);
      // Serve direct fallback products to keep the frontend running smoothly
      const fallbackProducts = [
        {
          id: "prod-1",
          name: "Cây Sen Đá Ngọc Mini",
          category: "plants",
          price: 35000,
          rating: 4.8,
          image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80",
          description: "Sen đá thạch ngọc nhỏ nhắn dưỡng ẩm tự nhiên, lọc không khí bàn làm việc.",
          ecoScore: 95,
          details: ["Đất trộn xỉ than tơi xốp", "Chậu đất nung mộc mạc", "Tưới nước 1 lần/tuần"],
          specs: { "Nguồn gốc": "Vườn ươm Đà Lạt", "Dấu chân carbon": "-8.2 kg CO2eq" },
          stock: 45
        },
        {
          id: "prod-2",
          name: "Dịch Phân Trùn Quế Hữu Cơ GreenLife 1L",
          category: "nutrients",
          price: 95000,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
          description: "Phân hữu cơ nước đậm đặc từ trùn quế giúp bổ sung acid humic bồi bổ đất.",
          ecoScore: 98,
          details: ["Dinh dưỡng vi sinh dồi dào", "Chai tái chế sinh học", "Pha loãng phun xịt lá"],
          specs: { "Nguồn gốc": "Trang trại hữu cơ Hòa Lạc", "Dấu chân carbon": "-18.5 kg CO2eq" },
          stock: 150
        },
        {
          id: "prod-3",
          name: "Cây Lưỡi Hổ Thái Lùn",
          category: "plants",
          price: 120000,
          rating: 4.7,
          image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80",
          description: "Lọc sạch bụi mịn, hấp thụ bức xạ điện từ và sản sinh khí oxy ban đêm rất tốt.",
          ecoScore: 92,
          details: ["Chịu râm mát văn phòng tốt", "Được trồng sẵn chậu sứ mộc", "Vòi phun sương đi kèm"],
          specs: { "Nguồn gốc": "Hợp tác xã xanh Hòa Bình", "Dấu chân carbon": "-12.5 kg CO2eq" },
          stock: 35
        },
        {
          id: "prod-4",
          name: "Bộ Cảm Biến Độ Ẩm Đất Smart-Grow IoT",
          category: "smarthome",
          price: 450000,
          rating: 4.6,
          image: "https://images.unsplash.com/photo-1558603668-6570496b66f8?w=600&auto=format&fit=crop&q=80",
          description: "Thiết bị đo độ ẩm đất liên tục gửi cảnh báo thông minh qua app giúp chống ngập úng.",
          ecoScore: 88,
          details: ["Kết nối wifi tầm xa", "Pin năng lượng mặt trời mini", "Chống nước chuẩn IP67"],
          specs: { "Nguồn gốc": "Xưởng IoT GreenLife Hà Nội", "Dấu chân carbon": "-3.5 kg CO2eq" },
          stock: 20
        },
        {
          id: "prod-5",
          name: "Chế phẩm Dầu Neem Sinh Học Ép Lạnh 250ml",
          category: "care",
          price: 135000,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&auto=format&fit=crop&q=80",
          description: "Tinh chất hạt sầu đâu ép lạnh tự nhiên giúp phòng ngừa và tiêu diệt nhện đỏ, bọ trĩ sáp.",
          ecoScore: 99,
          details: ["100% thiên nhiên không độc", "Hoạt chất Azadirachtin cao", "Phân hủy sinh học hoàn toàn"],
          specs: { "Nguồn gốc": "Liên minh ép dầu Bình Thuận", "Dấu chân carbon": "-22.0 kg CO2eq" },
          stock: 80
        }
      ];

      return res.json({ success: true, products: fallbackProducts, isMock: true });
    }
  } catch (error) {
    console.error("Fetch Products Error:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải danh sách sản phẩm." });
  }
});

export default router;
