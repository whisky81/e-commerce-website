import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    reply: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open"
    }
  },
  { timestamps: true }
);

const SupportMessage = mongoose.models.SupportMessage || mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
