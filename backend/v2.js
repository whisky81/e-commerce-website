// backend/v2.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import passport from "./config/passport.js";

// Routes
import authRoutes       from "./routes/v2/authRoutes.js";
import userRoutes       from "./routes/v2/userRoutes.js";
import productRoutes    from "./routes/v2/productRoutes.js";
import cartRoutes       from "./routes/v2/cartRoutes.js";
import reviewRoutes     from "./routes/v2/reviewRoutes.js";
import orderRoutes      from "./routes/v2/orderRoutes.js";
import adminRoutes      from "./routes/v2/adminRoutes.js";
import settingRoutes    from "./routes/v2/settingRoutes.js";
import marketingRoutes  from "./routes/v2/marketingRoutes.js";
import subscriberRoutes from "./routes/v2/subscriberRoutes.js";
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
  // temp logging 
  console.error('Unhandled Rejection:', reason);
  // Graceful shutdown
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  // temp logging 
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
