import mongoose from "mongoose";

/**
 * Subscriber – người đăng ký nhận email marketing
 * Tách hoàn toàn khỏi User để không phụ thuộc vào tài khoản
 */
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: "", trim: true },

    // Liên kết tới User nếu người dùng đã có tài khoản
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: { type: Boolean, default: true },

    // ✅ Theo dõi việc đã dùng ưu đãi 20% chào mừng chưa
    hasUsedWelcomeDiscount: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber
  || mongoose.model("Subscriber", subscriberSchema);
