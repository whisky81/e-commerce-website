// backend/routes/v2/subscriberRoutes.js
import express from "express";
import Subscriber from "../../models/v2/Subscriber.js";
import { protect } from "../../middleware/v2/auth.middleware.js";

const subscriberRoutes = express.Router();

// ─── Đăng ký nhận tin (public) ────────────────────────────────────────────────
subscriberRoutes.post("/", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.trim())
      return res.status(400).json({ success: false, message: "Email bắt buộc" });

    const emailLower = email.toLowerCase().trim();

    // Upsert – nếu đã tồn tại thì chỉ activate lại
    const subscriber = await Subscriber.findOneAndUpdate(
      { email: emailLower },
      {
        $set:         { email: emailLower, name: name || "", isActive: true },
        $setOnInsert: { hasUsedWelcomeDiscount: false },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Đăng ký nhận tin thành công! 🎉 Bạn sẽ nhận ưu đãi 20% cho đơn hàng đầu tiên.",
      data: { id: subscriber._id }
    });
  } catch (error) {
    // Duplicate key error (đã có nhưng isActive=true) – coi như thành công
    if (error.code === 11000) {
      return res.status(200).json({ success: true, message: "Email đã được đăng ký trước đó!" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Hủy đăng ký (public, qua email link) ─────────────────────────────────────
subscriberRoutes.get("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email bắt buộc" });
    await Subscriber.findOneAndUpdate({ email: email.toLowerCase() }, { isActive: false });
    res.status(200).json({ success: true, message: "Đã hủy đăng ký nhận tin" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Lấy danh sách (admin) ────────────────────────────────────────────────────
subscriberRoutes.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });

    const subscribers = await Subscriber.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("email name hasUsedWelcomeDiscount createdAt");

    res.status(200).json({ success: true, data: subscribers, total: subscribers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default subscriberRoutes;
