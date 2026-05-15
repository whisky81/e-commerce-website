import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";
import {
  addAddress, profile, updateProfile, updateAddress, bulkDeleteAddresses,
  listFavorites, addFavorite, removeFavorite,
  uploadAvatar,
} from "../controllers/user.controller.js";
import catchAsync from "../middleware/catchAsync.js";

const userRoutes = express.Router();

userRoutes.use(protect);


// ─── Profile ──────────────────────────────────────────────────────────────────
userRoutes.get ("/profile", catchAsync(profile));
userRoutes.put ("/profile", catchAsync(updateProfile));

// ─── Avatar ───────────────────────────────────────────────────────────────────
userRoutes.post(
  "/avatar",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  catchAsync(uploadAvatar)
);

// ─── Favorites ────────────────────────────────────────────────────────────────
userRoutes.get   ("/favorites", catchAsync(listFavorites));
userRoutes.post  ("/favorites/:productId", catchAsync(addFavorite));
userRoutes.delete("/favorites/:productId", catchAsync(removeFavorite));

// ─── Addresses ────────────────────────────────────────────────────────────────
userRoutes.post  ("/addresses", catchAsync(addAddress));
userRoutes.put   ("/addresses/:addressId", catchAsync(updateAddress));
userRoutes.delete("/addresses", catchAsync(bulkDeleteAddresses));

export default userRoutes;
