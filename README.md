# SE AI Audit Project Template

## 1. Project Information

| Item | Description |
|---|---|
| Course | SWP391 |
| Class | SE20A04 |
| Semester | SU26 |
| Group | 05 |
| Topic | GreenLife |
| Repository | Nền tảng dịch vụ cây cảnh trực tuyến |

---

## 2. Team Members

| No | Student ID | Full Name | GitHub Username | Role | Main Responsibility |
|---:|---|---|---|---|---|
| 1 | DE190622 | Trần Nhất Duy | tranduy132005 | Leader | Tester&Dev |
| 2 | DE190354 | Nguyễn Thanh Hoàng | hoang-11 | Member | Dev |
| 3 | DE190230 | Dương Thành Long | duonglong123 | Member | Dev |
| 4 |DE190206 | Lê Văn Minh Phát |Hihihi13213  | Member | Dev |

---

## 3. Project Structure

greenlife/
│
├── greenlife-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── greenlife-backend/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
│
├── database/
│   ├── greenlife.sql
│   └── migration/
│
├── ai-module/
│   ├── model/
│   ├── dataset/
│   └── api/
│
├── docs/
│   ├── AI_AUDIT_LOG.md
│   ├── PROMPTS.md
│   ├── CHANGELOG.md
│   └── REFLECTION.md
│
└── README.md

## 4. Required AI Audit Documents

Each group must maintain the following documents:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/REFLECTION.md
docs/CHANGELOG.md
```

---

## 5. Workflow

Students must follow this workflow:

```text
Issue → Branch → Commit → Pull Request → Review → Merge
```

Direct push to the `main` branch should be avoided.

---

## 6. Branch Naming Convention

```text
feature/studentid-task-name
bugfix/studentid-error-name
docs/studentid-update-audit-log
test/studentid-test-case-name
```

Example:

```text
feature/se123456-login-page
bugfix/se123456-login-validation
docs/se123456-update-ai-audit-log
```

---

## 7. Commit Message Convention

```text
[StudentID] type: short description
```

Examples:

```text
[SE123456] feat: add login page
[SE123456] fix: fix login validation
[SE123456] docs: update AI audit log
[SE123456] test: add login test cases
```

Common types:

```text
feat, fix, docs, test, refactor, style, chore
```

---

## 8. Local Development Setup

### 1. Prerequisites

Before setting up the project, make sure you have installed:
* **JDK 21**: Required for the backend (configured in `greenlife-backend/pom.xml` with `<java.version>21</java.version>`).
* **Node.js & npm (v18 or v20+ recommended)**: Required for the frontend development and build.
* **SQL Server**: Running local instance with TCP/IP connection enabled.
* **Git**: Installed and configured on your machine.

---

### 2. Clone and Update Repository

To get started, clone the repository:
```bash
git clone <GREENLIFE_REPOSITORY_URL>
cd <repository-folder>
```

For existing team members, update your local branch with the latest changes:
```bash
git checkout main
git pull --ff-only origin main
```

---

### 3. Database Setup

1. Open your SQL Server management client (e.g., SSMS) and create a database named `GreenLife`.
2. Initialize the base database schema by executing the SQL script:
   * `database/greenlife.sql`
3. If not already executed, run the authentication schema fix script:
   * `database/patch_auth_fix.sql`
4. Apply the database patches sequentially in numerical order from the `database/patches/` directory (from `patch_01` to `patch_19`):
   * Run `patch_01_add_verification_document.sql`
   * Run `patch_02_store_approval_audit.sql`
   * Run `patch_03_password_security.sql`
   * Run `patch_04_login_audit.sql`
   * Run `patch_05_wishlist.sql`
   * Run `patch_06_notifications.sql`
   * Run `patch_07_customer_addresses.sql`
   * Run `patch_08_bookings_snapshots_and_lifecycle.sql`
   * Run `patch_09_diagnosis_indexes.sql`
   * Run `patch_10_blog_indexes.sql`
   * Run `patch_11_auth_schema_alignment.sql`
   * Run `patch_12_payos_orders_columns.sql`
   * Run `patch_13_orders_payment_method_constraint.sql`
   * Run `patch_14_product_sku.sql`
   * Run `patch_15_order_lifecycle_statuses.sql`
   * Run `patch_16_return_review_statuses.sql`
   * Run `patch_17_return_request_reason.sql`
   * Run `patch_18_return_request_form_evidence.sql`
   * Run `patch_19_plant_care_services.sql` (Phase 5: Adds the customer_phone field to the bookings table)

> [!WARNING]
> Do not rerun the base initialization scripts (`greenlife.sql`) against an existing database containing user data without understanding their effect, as they will drop existing tables and delete all data.

---

### 4. Backend Configuration

The backend is configured via environment variables that override default local settings. Specify the following variables in your local environment:

#### Core Application Variables (Required to start)
* `DB_URL`: The JDBC connection string for SQL Server. Default fallback is:
  `jdbc:sqlserver://localhost:1433;databaseName=GreenLife;encrypt=false;loginTimeout=10`
  * Example: `jdbc:sqlserver://<YOUR_DATABASE_HOST>:1433;databaseName=GreenLife;encrypt=false`
* `DB_USERNAME`: Database username. Default fallback is `sa`.
  * Example: `<YOUR_DATABASE_USERNAME>`
* `DB_PASSWORD`: Database password. Default fallback is `sa`.
  * Example: `<YOUR_DATABASE_PASSWORD>`
* `GREENLIFE_JWT_SECRET`: Signing secret for authentication tokens. Replace with a 256-bit Base64 key for production.
  * Example: `<YOUR_JWT_SECRET_KEY>`
* `GREENLIFE_JWT_RESET_SECRET`: Signing secret for password reset tokens.
  * Example: `<YOUR_JWT_RESET_SECRET_KEY>`

#### Optional Integration Variables (Required only for specific feature testing)
* `PAYOS_CLIENT_ID`: PayOS integration client ID.
  * Example: `<YOUR_PAYOS_CLIENT_ID>`
* `PAYOS_API_KEY`: PayOS integration API key.
  * Example: `<YOUR_PAYOS_API_KEY>`
* `PAYOS_CHECKSUM_KEY`: PayOS integration checksum verification key.
  * Example: `<YOUR_PAYOS_CHECKSUM_KEY>`
* `GOOGLE_CLIENT_ID`: Google OAuth client ID for social login.
  * Example: `<YOUR_GOOGLE_CLIENT_ID>`
* `VNPAY_TMN_CODE`: VNPay merchant terminal code.
  * Example: `<YOUR_VNPAY_TMN_CODE>`
* `VNPAY_HASH_SECRET`: VNPay secure hash secret.
  * Example: `<YOUR_VNPAY_HASH_SECRET>`
* `MAIL_USERNAME` / `MAIL_PASSWORD`: SMTP credentials for email dispatch (default host is `smtp.gmail.com`).
  * Example: `<YOUR_MAIL_USERNAME>`, `<YOUR_MAIL_PASSWORD>`
* `REDIS_HOST` / `REDIS_PORT`: Redis configurations (default is `localhost:6379`). The application automatically falls back to an in-memory cache if Redis is not running locally.

---

### 5. Run Backend

1. Navigate to the backend directory:
   ```bash
   cd greenlife-backend
   ```
2. Compile the source code:
   * Windows: `mvnw.cmd clean compile`
   * Unix/macOS: `./mvnw clean compile`
3. Run the Spring Boot application:
   * Windows: `mvnw.cmd spring-boot:run`
   * Unix/macOS: `./mvnw spring-boot:run`

* **Default URL**: `http://localhost:8080`

---

### 6. Run Frontend

1. Navigate to the frontend directory:
   ```bash
   cd greenlife-frontend
   ```
2. Install the node package dependencies:
   ```bash
   npm ci
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Verify the production build:
   ```bash
   npm run build
   ```

* **Default URL**: `http://localhost:3000` (Vite dev server)

---

### 7. First Run Verification

Verify your environment using this checklist:
* [ ] The Spring Boot backend starts without connection errors or database connection pool failures.
* [ ] The Vite development server launches and displays the frontend application at `http://localhost:3000`.
* [ ] The Login page loads and API requests are successfully proxied to the backend without CORS errors.
* [ ] The **Plant Care Services** (Dịch vụ chăm sóc) view loads.
* [ ] The Store Owner **Dịch vụ & Lịch hẹn** (Store Services Management) view loads.

*Note: Authenticated features (e.g. service booking, order checkout) require an active user account and initialized database schema.*

---

### 8. Common Setup Problems

* **Database Connection Failed**: Ensure your local SQL Server instance is running, TCP/IP connections are enabled in SQL Server Configuration Manager, and it is listening on port 1433.
* **Incorrect Database Credentials**: Ensure the environment variables `DB_USERNAME` and `DB_PASSWORD` are configured and match your SQL Server credentials.
* **Missing Database Patches**: If APIs throw SQL errors indicating missing columns or tables, verify that all SQL patches (`patch_01` to `patch_19`) have been successfully applied in numeric order.
* **Port 8080 Already In Use**: Another application is running on port 8080. Terminate the blocking process before running the backend.
* **Frontend Cannot Reach Backend**: Confirm the backend is running on `http://localhost:8080` and the Vite proxy is configured correctly.
* **`npm ci` Failure**: If package installation fails due to dependency conflicts, run `npm install` instead to let npm resolve platform-specific packages.
* **JDK Version Mismatch**: Run `java -version` to verify that your active runtime is JDK 21.

---

### 9. Git Hygiene for Team Members

To keep the repository clean and stable:
* **Never commit generated directories**:
  * `greenlife-backend/target/`
  * `greenlife-frontend/node_modules/`
  * `greenlife-frontend/dist/`
* **Never commit local secrets or credentials**: Keep environment variables outside your tracking branch and never save database passwords in application configuration files.
* **Exclusion of personal planning files**: Do not check in personal planning files or local execution reports. Add local workspace files to the private ignore file `.git/info/exclude` instead of modifying the shared `.gitignore` file.

---

## 9. AI Usage Rule

Students are allowed to use AI tools such as ChatGPT, Gemini, Claude, GitHub Copilot, Cursor, Antigravity, or similar tools.

However, all important AI usage must be recorded in:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/CHANGELOG.md
docs/REFLECTION.md
```

Students must be able to explain, verify, and defend all submitted work.
