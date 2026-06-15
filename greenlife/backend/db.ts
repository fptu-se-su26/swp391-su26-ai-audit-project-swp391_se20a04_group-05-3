import mssql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: mssql.config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "your_strong_password",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "greenlife_db",
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: true, // Crucial for local dev with self-signed SSL certs
  },
  // Set short timeout so the app won't hang for 15s if SQL Server is not running
  connectionTimeout: 5000,
  requestTimeout: 5000,
};

let pool: mssql.ConnectionPool | null = null;
let isConnected = false;

// Initialize connection pool
export async function getDBPool(): Promise<mssql.ConnectionPool | null> {
  if (pool && isConnected) {
    return pool;
  }

  try {
    console.log(`🌐 Đang kết nối SQL Server tại ${dbConfig.server}:${dbConfig.port}...`);
    pool = await new mssql.ConnectionPool(dbConfig).connect();
    isConnected = true;
    console.log("✅ Kết nối SQL Server thành công!");
    
    // Auto-create table AIChatLogs if it doesn't exist
    await createTableIfMissing(pool);
    
    return pool;
  } catch (err: any) {
    console.warn("⚠️ Không thể kết nối SQL Server:", err.message || err);
    console.warn("💡 Mẹo: Hãy kiểm tra xem SQL Server đã được chạy chưa, và thông tin đăng nhập trong file .env có chính xác không.");
    isConnected = false;
    pool = null;
    return null;
  }
}

// Helper to create table if it doesn't exist
async function createTableIfMissing(connectionPool: mssql.ConnectionPool) {
  try {
    const checkTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AIChatLogs' and xtype='U')
      BEGIN
        CREATE TABLE AIChatLogs (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Question NVARCHAR(MAX) NOT NULL,
            Response NVARCHAR(MAX) NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
        SELECT 1 AS Created;
      END
      ELSE
      BEGIN
        SELECT 0 AS Created;
      END
    `;
    const result = await connectionPool.request().query(checkTableQuery);
    if (result.recordset[0]?.Created === 1) {
      console.log("📦 Đã tự động khởi tạo bảng 'AIChatLogs' trong SQL Server.");
    } else {
      console.log("📦 Bảng 'AIChatLogs' đã tồn tại trong SQL Server.");
    }
  } catch (err: any) {
    console.error("❌ Lỗi khi khởi tạo bảng AIChatLogs:", err.message || err);
  }
}

// Main save log function
export async function saveChatLogToDB(question: string, response: string): Promise<boolean> {
  try {
    const activePool = await getDBPool();
    if (!activePool) {
      console.warn("⚠️ Bỏ qua lưu log vào DB vì chưa thiết lập hoặc chưa chạy SQL Server.");
      return false;
    }

    const request = activePool.request();
    request.input("Question", mssql.NVarChar(mssql.MAX), question);
    request.input("Response", mssql.NVarChar(mssql.MAX), response);

    const query = `
      INSERT INTO AIChatLogs (Question, Response, CreatedAt)
      VALUES (@Question, @Response, GETDATE())
    `;

    await request.query(query);
    console.log("💾 Lưu nhật ký chat AI vào SQL Server thành công!");
    return true;
  } catch (err: any) {
    console.error("❌ Lỗi khi lưu nhật ký chat vào database:", err.message || err);
    return false;
  }
}

// Helper to execute parameterized queries safely
export async function queryDB(query: string, params: Record<string, any> = {}): Promise<mssql.IResult<any> | null> {
  try {
    const activePool = await getDBPool();
    if (!activePool) {
      return null;
    }
    const request = activePool.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    return await request.query(query);
  } catch (err: any) {
    console.error("❌ Lỗi truy vấn SQL:", err.message || err);
    throw err;
  }
}

