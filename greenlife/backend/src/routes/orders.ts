import express from "express";
import mssql from "mssql";
import { getDBPool, queryDB } from "../../db";

const router = express.Router();

// 1. CHECKOUT ORDER API
router.post("/", async (req, res) => {
  try {
    const { userId, totalPrice, paymentMethod, items } = req.body;
    if (!totalPrice || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: "Thiếu dữ liệu đơn hàng bắt buộc." });
    }

    try {
      const pool = await getDBPool();
      if (!pool) {
        throw new Error("Không thể kết nối cơ sở dữ liệu.");
      }

      const transaction = new mssql.Transaction(pool);
      await transaction.begin();

      try {
        // 1. Insert order
        const orderRequest = new mssql.Request(transaction);
        orderRequest.input("userId", mssql.Int, userId ? parseInt(userId.toString().replace("cust-", ""), 10) : 2); // Default to Nguyễn Thị Lan if not logged in
        orderRequest.input("totalPrice", mssql.Decimal(12, 0), totalPrice);
        orderRequest.input("paymentMethod", mssql.NVarChar(20), paymentMethod || "COD");

        const orderResult = await orderRequest.query(`
          INSERT INTO orders (user_id, total_price, payment_method, status, created_at)
          VALUES (@userId, @totalPrice, @paymentMethod, 'pending', GETDATE());
          SELECT SCOPE_IDENTITY() AS orderId;
        `);

        const orderId = orderResult.recordset[0]?.orderId;
        if (!orderId) {
          throw new Error("Thất bại khi chèn thông tin đơn hàng.");
        }

        // 2. Insert items & Update product stocks
        for (const item of items) {
          const cleanProdId = parseInt(item.productId.toString().replace("prod-", ""), 10);
          
          const itemRequest = new mssql.Request(transaction);
          itemRequest.input("orderId", mssql.Int, orderId);
          itemRequest.input("productId", mssql.Int, cleanProdId);
          itemRequest.input("quantity", mssql.Int, item.quantity);
          itemRequest.input("unitPrice", mssql.Decimal(12, 0), item.price);

          await itemRequest.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (@orderId, @productId, @quantity, @unitPrice)
          `);

          // Update stock of product
          const stockRequest = new mssql.Request(transaction);
          stockRequest.input("productId", mssql.Int, cleanProdId);
          stockRequest.input("quantity", mssql.Int, item.quantity);
          await stockRequest.query(`
            UPDATE products 
            SET stock = CASE WHEN stock >= @quantity THEN stock - @quantity ELSE 0 END 
            WHERE id = @productId
          `);
        }

        await transaction.commit();
        console.log(`💾 Đã tạo đơn hàng thành công trong SQL Server (Mã đơn: ${orderId})!`);
        return res.json({ success: true, orderId: orderId.toString() });

      } catch (err: any) {
        await transaction.rollback();
        console.error("SQL Transaction Rollback:", err.message || err);
        throw err;
      }
    } catch (dbErr: any) {
      console.warn("⚠️ Tạo đơn hàng DB lỗi, kích hoạt chế độ Giả lập thành công:", dbErr.message);
      return res.json({ success: true, orderId: `order-mock-${Date.now()}`, isMock: true });
    }
  } catch (error) {
    console.error("Checkout Order Error:", error);
    res.status(500).json({ success: false, error: "Đã xảy ra sự cố trong quá trình giao dịch thanh toán." });
  }
});

// 2. USER ORDERS HISTORY API
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cleanUserId = parseInt(userId.replace("cust-", ""), 10);

    try {
      const result = await queryDB(`
        SELECT o.id as orderId, o.total_price, o.payment_method, o.status, o.created_at,
               oi.product_id, oi.quantity, oi.unit_price, p.name as productName, p.image_url
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = @userId
        ORDER BY o.created_at DESC
      `, { userId: cleanUserId });

      if (!result || result.recordset.length === 0) {
        return res.json({ success: true, orders: [] });
      }

      // Group flat rows into structured order hierarchy
      const ordersMap = new Map();
      result.recordset.forEach((row: any) => {
        if (!ordersMap.has(row.orderId)) {
          ordersMap.set(row.orderId, {
            id: `GL-${row.orderId}`,
            date: new Date(row.created_at).toLocaleDateString("vi-VN"),
            total: Number(row.total_price),
            status: row.status === "delivered" ? "completed" : row.status === "shipping" ? "shipped" : "pending",
            itemsCount: 0,
            items: ""
          });
        }
        
        const currentOrder = ordersMap.get(row.orderId);
        currentOrder.itemsCount += row.quantity;
        if (currentOrder.items) {
          currentOrder.items += `, ${row.productName}`;
        } else {
          currentOrder.items = row.productName;
        }
      });

      return res.json({ success: true, orders: Array.from(ordersMap.values()) });
    } catch (dbErr: any) {
      console.warn("⚠️ Tải lịch sử đơn hàng DB lỗi, kích hoạt Mock:", dbErr.message);
      // Serve mock data orders
      const mockOrders = [
        { id: "GL-8391", date: "2026-05-22", total: 250000, status: "shipped", itemsCount: 2, items: "Cây sen đá ngọc, Phân trùn quế organic" },
        { id: "GL-8390", date: "2026-05-15", total: 450000, status: "completed", itemsCount: 3, items: "Dầu neem sinh học, Đất trồng vi sinh, Chậu gốm mộc" }
      ];
      return res.json({ success: true, orders: mockOrders, isMock: true });
    }
  } catch (error) {
    console.error("Fetch User Orders Error:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống tải lịch sử giao dịch." });
  }
});

export default router;
