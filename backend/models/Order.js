import mongoose from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: {
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      }
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    district: String,
    ward: String,
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
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending"
    },
    welcomeDiscount: { type: Boolean, default: false },
    welcomeDiscountAmount: { type: Number, default: 0 },
    // true if order created from cart -> verify handler clears cart after payment
    // false if order placed from custom orderItems in body -> don't clear cart
    fromCart: { type: Boolean, default: false },
    itemsPrice:    { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

orderSchema.virtual("orderStats").get(function () {
    let totalItemsPrice = 0;
    let totalItemsQuantity = 0;
    for (const item of this.items) {
      totalItemsPrice += item.price * item.quantity;
      totalItemsQuantity += item.quantity;
    }
    return {
      totalItemsPrice,
      totalItemsQuantity,
      totalPrice: totalItemsPrice + (this.shippingPrice || 0),
    };
});
orderSchema.plugin(mongooseLeanVirtuals);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
