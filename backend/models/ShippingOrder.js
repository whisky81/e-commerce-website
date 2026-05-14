import mongoose from "mongoose";

const shippingOrderSchema = new mongoose.Schema({
  order: { type: ObjectId, ref: 'Order', required: true, unique: true }, // 1-1

  provider: { type: String, default: 'ghn' },
  providerOrderCode: String, // mã GHN trả về
  clientOrderCode: String,   // = order.code, để idempotent

  status: { type: String, default: 'pending' }, // lưu luôn status GHN gốc
  fee: { total: Number, main: Number, insurance: Number },
  expectedDelivery: Date,
  trackingUrl: String,

  lastResponse: mongoose.Schema.Types.Mixed // để debug, không cần parse
}, { timestamps: true });

const ShippingOrder =
  mongoose.models.ShippingOrder ||
  mongoose.model("ShippingOrder", shippingOrderSchema);

export default ShippingOrder;