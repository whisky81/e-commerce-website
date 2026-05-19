import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
    getProductDetailAdmin,
    createProduct,
    bulkDeleteProducts,
    updateProduct
} from "../controllers/admin/product.js";
import catchAsync from "../middleware/catchAsync.js";
import { bulkDeleteReviews, getReviewsAdmin, toggleReviewHidden } from "../controllers/admin/review.js";
import upload from "../middleware/multer.js";
import { adminStats } from "../controllers/adminStats.controller.js";
import { bulkDeactivateUsers, getUsersAdmin, toggleUserActive } from "../controllers/admin/user.js"
import { getSupportMessages, replyToSupportMessage } from "../controllers/admin/support.js";
import Subscriber from "../models/Subscriber.js";
import ApiResponse from "../utils/ApiResponse.js";

const adminRoutes = express.Router();

// new 
adminRoutes.use(protect, adminOnly);
adminRoutes.get("/stats", catchAsync(adminStats));
// product 
adminRoutes.get("/products/:productId", catchAsync(getProductDetailAdmin));
adminRoutes.post('/products', upload.fields([
    { name: 'img1', maxCount: 1 }, { name: 'img2', maxCount: 1 },
    { name: 'img3', maxCount: 1 }, { name: 'img4', maxCount: 1 },
]), catchAsync(createProduct));
adminRoutes.delete("/products", catchAsync(bulkDeleteProducts));
adminRoutes.put("/products/:productId", catchAsync(updateProduct));
// reviews 
adminRoutes.get("/reviews", catchAsync(getReviewsAdmin));
adminRoutes.put("/reviews/:id/toggle-hidden", catchAsync(toggleReviewHidden));
adminRoutes.delete("/reviews", catchAsync(bulkDeleteReviews));
// user 
adminRoutes.get("/users", catchAsync(getUsersAdmin));
adminRoutes.patch("/users/:id/toggle-active", catchAsync(toggleUserActive));
adminRoutes.post("/users/bulk-deactivate", catchAsync(bulkDeactivateUsers));

// support
adminRoutes.get("/support", catchAsync(getSupportMessages));
adminRoutes.patch("/support/:id/reply", catchAsync(replyToSupportMessage));

// subscriber 
adminRoutes.get("/subscribers", catchAsync(async (req, res) => {
    const subscribers = await Subscriber
        .find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("email name hasUsedWelcomeDiscount createdAt");
    new ApiResponse(true, 200, "Success", subscribers, {
        total: subscribers.length
    }).send(res);
}));
export default adminRoutes;
