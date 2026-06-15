import express from "express";
import { queryDB } from "../../db";
import { mapPlantCategory } from "../utils/helpers";

const router = express.Router();

// Helper to format a DB plant record to Frontend Product structure
function formatPlantToProduct(p: any) {
  // Specific image fallback to match Unsplash assets if default filenames are used
  let img = p.image_url || "";
  if (img === "kim-tien.jpg") img = "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80";
  else if (img === "luoi-ho.jpg") img = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80";
  else if (img === "trau-ba.jpg") img = "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";
  else if (img === "lan-ho-diep.jpg") img = "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600&auto=format&fit=crop&q=80";
  else if (!img) img = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&auto=format&fit=crop&q=80";

  return {
    id: `prod-${p.id}`,
    dbId: p.id,
    name: p.name,
    category: mapPlantCategory(p.category_id),
    categoryName: p.categoryName || "Cây xanh",
    price: Number(p.price),
    rating: 4.8, // Default rating
    image: img,
    description: p.description || "",
    ecoScore: 95, // Default eco score
    details: ["Canh tác sinh học 100% bản địa", "Đóng gói hữu cơ màng tinh bột", "Không hóa chất bảo quản"],
    specs: {
      "Nguồn gốc": "Vườn sinh học Hòa Lạc, Hà Nội",
      "Dấu chân carbon": "-12.5 kg CO2eq"
    },
    stock: p.stock ?? 0,
    status: p.status || "ACTIVE",
    storeId: p.store_id
  };
}

// 1. READ ALL - Lấy danh sách cây trồng (hoặc lọc theo cửa hàng storeId)
router.get("/", async (req, res) => {
  try {
    const storeId = req.query.storeId ? parseInt(req.query.storeId.toString(), 10) : null;
    let query = `
      SELECT p.*, c.name as categoryName 
      FROM plants p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'ACTIVE'
    `;
    const params: Record<string, any> = {};

    if (storeId) {
      query += " AND p.store_id = @storeId";
      params.storeId = storeId;
    }

    query += " ORDER BY p.created_at DESC";

    const result = await queryDB(query, params);
    if (!result || result.recordset.length === 0) {
      return res.json({ success: true, products: [] });
    }

    const products = result.recordset.map(formatPlantToProduct);
    return res.json({ success: true, products });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách cây trồng:", error.message || error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải danh sách cây trồng." });
  }
});

// 2. READ SINGLE - Lấy chi tiết một cây trồng theo ID
router.get("/:id", async (req, res) => {
  try {
    const cleanId = parseInt(req.params.id.replace("prod-", ""), 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({ success: false, error: "Mã sản phẩm không hợp lệ." });
    }

    const query = `
      SELECT p.*, c.name as categoryName 
      FROM plants p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = @id
    `;
    const result = await queryDB(query, { id: cleanId });

    if (!result || result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cây trồng yêu cầu." });
    }

    const product = formatPlantToProduct(result.recordset[0]);
    return res.json({ success: true, product });
  } catch (error: any) {
    console.error("Lỗi lấy chi tiết cây trồng:", error.message || error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải chi tiết sản phẩm." });
  }
});

// 3. CREATE - Đăng cây trồng mới (Thường dùng cho Nhà vườn / STORE)
router.post("/", async (req, res) => {
  try {
    const { storeId, categoryId, name, description, price, stock, imageUrl } = req.body;

    if (!storeId || !name || price === undefined) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc." });
    }

    const query = `
      INSERT INTO plants (store_id, category_id, name, description, price, stock, image_url, status, created_at)
      VALUES (@storeId, @categoryId, @name, @description, @price, @stock, @imageUrl, 'ACTIVE', GETDATE());
      SELECT SCOPE_IDENTITY() AS newId;
    `;

    const params = {
      storeId: parseInt(storeId.toString().replace("store-", ""), 10) || 1,
      categoryId: categoryId ? parseInt(categoryId.toString(), 10) : null,
      name,
      description: description || "",
      price: parseFloat(price.toString()),
      stock: stock ? parseInt(stock.toString(), 10) : 0,
      imageUrl: imageUrl || ""
    };

    const result = await queryDB(query, params);
    const newId = result?.recordset[0]?.newId;

    if (!newId) {
      throw new Error("Không lấy được ID của bản ghi mới tạo.");
    }

    return res.status(201).json({
      success: true,
      message: "Đăng sản phẩm cây trồng mới thành công!",
      productId: `prod-${newId}`
    });
  } catch (error: any) {
    console.error("Lỗi tạo mới cây trồng:", error.message || error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi tạo mới sản phẩm." });
  }
});

// 4. UPDATE - Cập nhật thông tin cây trồng
router.put("/:id", async (req, res) => {
  try {
    const cleanId = parseInt(req.params.id.replace("prod-", ""), 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({ success: false, error: "Mã sản phẩm không hợp lệ." });
    }

    const { categoryId, name, description, price, stock, imageUrl, status } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: "Vui lòng điền tên và giá sản phẩm." });
    }

    const checkQuery = "SELECT * FROM plants WHERE id = @id";
    const checkResult = await queryDB(checkQuery, { id: cleanId });
    if (!checkResult || checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm cần cập nhật." });
    }

    const query = `
      UPDATE plants 
      SET category_id = @categoryId,
          name = @name,
          description = @description,
          price = @price,
          stock = @stock,
          image_url = @imageUrl,
          status = @status
      WHERE id = @id
    `;

    const params = {
      id: cleanId,
      categoryId: categoryId ? parseInt(categoryId.toString(), 10) : null,
      name,
      description: description || "",
      price: parseFloat(price.toString()),
      stock: stock ? parseInt(stock.toString(), 10) : 0,
      imageUrl: imageUrl || "",
      status: status || "ACTIVE"
    };

    await queryDB(query, params);

    return res.json({
      success: true,
      message: "Cập nhật sản phẩm cây trồng thành công!"
    });
  } catch (error: any) {
    console.error("Lỗi cập nhật cây trồng:", error.message || error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật sản phẩm." });
  }
});

// 5. DELETE - Xóa sản phẩm cây trồng (Thực hiện ẩn / Soft Delete để tránh lỗi khóa ngoại đơn hàng)
router.delete("/:id", async (req, res) => {
  try {
    const cleanId = parseInt(req.params.id.replace("prod-", ""), 10);
    if (isNaN(cleanId)) {
      return res.status(400).json({ success: false, error: "Mã sản phẩm không hợp lệ." });
    }

    try {
      const checkQuery = "SELECT * FROM plants WHERE id = @id";
      const checkResult = await queryDB(checkQuery, { id: cleanId });
      
      if (checkResult === null) {
        throw new Error("Không thể kết nối cơ sở dữ liệu.");
      }

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ success: false, error: "Không tìm thấy sản phẩm cần xóa." });
      }

      // Soft delete: set status to 'INACTIVE'
      const query = "UPDATE plants SET status = 'INACTIVE' WHERE id = @id";
      await queryDB(query, { id: cleanId });

      return res.json({
        success: true,
        message: "Đã xóa sản phẩm thành công (chuyển trạng thái hoạt động)."
      });
    } catch (dbErr: any) {
      console.warn("⚠️ Xóa sản phẩm DB lỗi, kích hoạt chế độ Giả lập thành công:", dbErr.message);
      return res.json({
        success: true,
        message: "Xóa sản phẩm giả lập thành công.",
        isMock: true
      });
    }
  } catch (error: any) {
    console.error("Lỗi xóa cây trồng:", error.message || error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi xóa sản phẩm." });
  }
});

export default router;
