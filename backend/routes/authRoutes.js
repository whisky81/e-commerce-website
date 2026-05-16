// backend/routes/authRoutes.js
import express from "express";
import {
  register, login, logout,
  verifyEmail, resendVerification
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import passport, { setTokenCookie } from "../config/passport.js";
import catchAsync from "../middleware/catchAsync.js";

const authRoutes = express.Router();

authRoutes.post("/register",            catchAsync(register));
authRoutes.post("/login",               catchAsync(login));
authRoutes.post("/logout",   protect,   catchAsync(logout));
authRoutes.get ("/verify-email",        catchAsync(verifyEmail));
authRoutes.post("/resend-verification", protect, catchAsync(resendVerification));

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// GET /api/auth/google — Bước 1: Redirect người dùng sang trang đăng nhập Google
authRoutes.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/auth/google/callback — Bước 2: Google redirect về đây sau khi user chấp nhận
authRoutes.get("/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google`,
  }),
  catchAsync(async (req, res) => {
    setTokenCookie(res, req.user);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?auth=success`);
  })
);

// ─── Facebook OAuth ───────────────────────────────────────────────────────────
// GET /api/auth/facebook — Bước 1: Redirect người dùng sang trang đăng nhập Facebook
authRoutes.get("/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false })
);

// GET /api/auth/facebook/callback — Bước 2: Facebook redirect về đây sau khi user chấp nhận
authRoutes.get("/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=facebook`,
  }),
  catchAsync(async (req, res) => {
    setTokenCookie(res, req.user);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?auth=success`);
  })
);

export default authRoutes;
