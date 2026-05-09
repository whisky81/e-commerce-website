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

authRoutes.post("/register", catchAsync(register));
authRoutes.post("/login",    catchAsync(login));
authRoutes.post("/logout",   protect, catchAsync(logout));
authRoutes.get ("/verify-email",         catchAsync(verifyEmail));
authRoutes.post("/resend-verification",  protect, catchAsync(resendVerification));

// ─── Google OAuth ─────────────────────────────────────────────────────────────
authRoutes.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
authRoutes.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google` }),
  (req, res) => {
    setTokenCookie(res, req.user);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?auth=success`);
  }
);

// ─── Facebook OAuth ───────────────────────────────────────────────────────────
authRoutes.get("/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false })
);
authRoutes.get("/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=facebook` }),
  (req, res) => {
    setTokenCookie(res, req.user);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?auth=success`);
  }
);

export default authRoutes;
