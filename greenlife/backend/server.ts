import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Mount middlewares
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Import Routers
import authRouter from "./src/routes/auth";
import productsRouter from "./src/routes/products";
import ordersRouter from "./src/routes/orders";
import articlesRouter from "./src/routes/articles";
import feedbacksRouter from "./src/routes/feedbacks";
import aiRouter from "./src/routes/ai";

// Mount Routers
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/feedbacks", feedbacksRouter);
app.use("/api", aiRouter); // Mount AI routes under /api so /api/ai-diagnosis and /api/ai/chat work seamlessly!

// Start the Express server on port 5000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend API Server listening on http://localhost:${PORT}`);
});
