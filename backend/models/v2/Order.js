import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name:     { type: String, required: true },
    image:    { type: String, required: true },
    price:    { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone:    String,
    street:   String,
    ward:     String,
    district: String,
    province: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [orderItemSchema],

    shippingAddress: shippingAddressSchema,

    paymentMethod: {
      type: String,
      enum: ["cod", "vnpay", "momo", "paypal", "stripe"],
      default: "cod"
    },

    itemsPrice:    { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, default: 0, min: 0 },
    totalPrice:    { type: Number, required: true, min: 0 },

    isPaid:  { type: Boolean, default: false },
    paidAt:  Date,

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending"
    },

    // ✅ Ưu đãi chào mừng 20% cho đơn đầu tiên
    welcomeDiscount:       { type: Boolean, default: false },
    welcomeDiscountAmount: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
