// backend/v2.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import seedAdmin from "./config/seedAdmin.js";
import passport from "./config/passport.js";
import logger from "./config/Logger.js";
import shippingProvider from "./config/shipping.js";

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
import addrRoutes from "./routes/v3/addressRoutes.js";
import orderRoutesV3 from "./routes/v3/orderRoutes.js";
import adminRoutesV3 from "./routes/v3/adminRoutes.js";
import shippingRoutesV3 from "./routes/v3/shippingRoutes.js";

const app  = express();
const port = process.env.PORT || 5000;

connectDB();
connectCloudinary();
seedAdmin();
console.log(shippingProvider);

// ─── Middleware ───────────────────────────────────────────────────────────────
// CORS must be first so preflight OPTIONS requests are handled before body parsers
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use("/api/auth",        authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/products",    productRoutes);
app.use("/api/cart",        cartRoutes);
app.use("/api/reviews",     reviewRoutes);
app.use("/api/orders",      orderRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/setting",     settingRoutes);
app.use("/api/marketing",   marketingRoutes);
app.use("/api/subscribers", subscriberRoutes);

// api version 3 
app.use("/api/v3/addresses/3-level", addrRoutes);
app.use("/api/v3/admin", adminRoutesV3);
app.use("/api/v3", orderRoutesV3);
app.use("/api/v3/shipping", shippingRoutesV3);


app.get("/", (req, res) => {
  const { origin = "https://test.org" } = req.headers;
  res.json({ message: "ABC Shop API v2 is running", origin })
});

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
  // console.log(err);
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack 
  });
  process.exit(1);
});