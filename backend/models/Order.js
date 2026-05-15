import mongoose from "mongoose";
import { ulid } from 'ulid';
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },

  code: { type: String, unique: true, index: true }, // VD: ORDER_DD_MM_YYYY_NNNN

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    image: { url: String, publicId: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],

  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^(0|\+84)[3|5|7|8|9]\d{8}$/ },
    street: { type: String, required: true },

    wardCode: String,
    districtId: Number,
    provinceId: Number,

    wardName: { type: String, required: true },
    districtName: { type: String, required: true },
    provinceName: { type: String, required: true }
  },

  payment: {
    method: { type: String, enum: ['cod', 'bank'], default: 'cod' },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  },


  fee: {
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },

  // package measurement
  package: {
    weight: Number, 
    length: Number, 
    width: Number, 
    height: Number
  },

  status: { type: String, enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'], default: 'pending' },
  note: String
}, { timestamps: true });

orderSchema.pre("validate", function () {
  this.fee.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping = this.fee.shipping || 0;
  const discount = this.fee.discount || 0;

  this.fee.total =
    this.fee.subtotal +
    shipping -
    discount;

  if (this.isNew && !this.code) {
    this.code = `DH${ulid()}`;
  }
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
