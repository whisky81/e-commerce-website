import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, default: "", trim: true },
    // Link to an existing user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    // Track whether the 20% welcome discount has been used.
    hasUsedWelcomeDiscount: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber
  || mongoose.model("Subscriber", subscriberSchema);
