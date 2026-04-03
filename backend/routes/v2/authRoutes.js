// backend/routes/v2/authRoutes.js
import express from "express";
import {
  register, login, logout,
  verifyEmail, resendVerification
} from "../../controllers/v2/auth.controller.js";
import { protect } from "../../middleware/v2/auth.middleware.js";
import passport, { setTokenCookie } from "../../config/passport.js";

const authRoutes = express.Router();

// ─── Cơ bản ───────────────────────────────────────────────────────────────────
authRoutes.post("/register", register);
authRoutes.post("/login",    login);
authRoutes.post("/logout",   protect, logout);

// ─── Email verification ───────────────────────────────────────────────────────
authRoutes.get ("/verify-email",         verifyEmail);
authRoutes.post("/resend-verification",  protect, resendVerification);

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
