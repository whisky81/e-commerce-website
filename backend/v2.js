// backend/v2.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import passport from "./config/passport.js";
import logger from "./config/Logger.js";

// Routes
import authRoutes       from "./routes/authRoutes.js";
import userRoutes       from "./routes/userRoutes.js";
import productRoutes    from "./routes/productRoutes.js";
import cartRoutes       from "./routes/cartRoutes.js";
import reviewRoutes     from "./routes/reviewRoutes.js";
import orderRoutes      from "./routes/orderRoutes.js";
import adminRoutes      from "./routes/adminRoutes.js";
import settingRoutes    from "./routes/settingRoutes.js";
import marketingRoutes  from "./routes/marketingRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";

const app  = express();
const port = process.env.PORT || 5000;

connectDB();
connectCloudinary();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(cookieParser());
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use("/api/v2/auth",        authRoutes);
app.use("/api/v2/users",       userRoutes);
app.use("/api/v2/products",    productRoutes);
app.use("/api/v2/cart",        cartRoutes);
app.use("/api/v2/reviews",     reviewRoutes);
app.use("/api/v2/orders",      orderRoutes);
app.use("/api/v2/admin",       adminRoutes);
app.use("/api/v2/setting",     settingRoutes);
app.use("/api/v2/marketing",   marketingRoutes);
app.use("/api/v2/subscribers", subscriberRoutes);

app.get("/", (req, res) => res.json({ message: "ABC Shop API v2 is running" }));

app.use(errorHandler);

const server = app.listen(port, () => console.log(`🚀 Server running: http://localhost:${port}`));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason
  })
  // Graceful shutdown
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack 
  });
  process.exit(1);
});
