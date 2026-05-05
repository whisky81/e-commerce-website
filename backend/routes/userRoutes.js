// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";
import {
  addAddress, profile, updateProfile, updateAddress, deleteAddress,
  listFavorites, addFavorite, removeFavorite,
  uploadAvatar,
} from "../controllers/user.controller.js";

const userRoutes = express.Router();

// ─── Profile ──────────────────────────────────────────────────────────────────
userRoutes.get ("/profile", protect, profile);
userRoutes.put ("/profile", protect, updateProfile);

// ─── Avatar ───────────────────────────────────────────────────────────────────
userRoutes.post(
  "/avatar",
  protect,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  uploadAvatar
);

// ─── Favorites ────────────────────────────────────────────────────────────────
userRoutes.get   ("/favorites",           protect, listFavorites);
userRoutes.post  ("/favorites/:productId",protect, addFavorite);
userRoutes.delete("/favorites/:productId",protect, removeFavorite);

// ─── Addresses ────────────────────────────────────────────────────────────────
userRoutes.post  ("/addresses",            protect, addAddress);
userRoutes.put   ("/addresses/:addressId", protect, updateAddress);
userRoutes.delete("/addresses/:addressId", protect, deleteAddress);

export default userRoutes;
