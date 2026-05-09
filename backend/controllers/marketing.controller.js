// backend/controllers/marketing.controller.js
import Subscriber from "../models/Subscriber.js"
import Product from "../models/Product.js"
import { sendPromotionEmail } from "../services/emailService.js"
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
export const sendBulkPromo = async (req, res) => {
  const { subject, promoCode, productIds } = req.body
  let products = []
  if (
    productIds &&
    Array.isArray(productIds) &&
    productIds.length > 0
  ) {
    products = await Product
      .find({ _id: { $in: productIds } })
      .select("_id name price images discount saleStartAt saleEndAt")
      .lean({ virtuals: true });
  } else {
    // Get 6 on-sale products
    products = await Product
      .find({ discount: { $gt: 0 } })
      .select("_id name price images discount saleStartAt saleEndAt")
      .sort({ discount: -1 })
      .limit(6)
      .lean({ virtuals: true });
  }
  const subscribers = await Subscriber.find({ isActive: true }).select("name email")
  if (!subscribers.length) {
    return new ApiResponse(
      true, 200,
      "No subscribers to send emails to", null, {
      sent: 0,
      failed: 0,
      total: 0
    }).send(res);
  }
  let sent = 0, failed = 0
  for (const sub of subscribers) {
    try {
      await sendPromotionEmail({
        to: sub.email,
        name: sub.name || "Khách hàng",
        subject: subject || "🔥 Ưu đãi đặc biệt từ ABC Shop!",
        products,
        promoCode,
      })
      ++sent;
    } catch {
      ++failed;
    }
  }
  new ApiResponse(
    true, 
    200, 
    "Success", 
    null, {
      sent,
      failed,
      total: subscribers.length
    }).send(res);
}
/** Áp dụng discount hàng loạt cho nhiều sản phẩm */
export const applyBulkDiscount = async (req, res) => {
  let { productIds, discount, saleStartAt, saleEndAt } = req.body
  if (discount < 0 || discount > 100)
    throw new AppError("Discount must be between 1-100", 400);
  saleStartAt = saleStartAt ? new Date(saleStartAt) : null;
  saleEndAt = saleEndAt ? new Date(saleEndAt) : null;
  if (saleStartAt && saleEndAt && saleStartAt >= saleEndAt) throw new AppError("Invalid date");
  const filter = productIds?.length ? { _id: { $in: productIds } } : {}
  await Product.updateMany(filter, {
    $set: {
      discount: Number(discount),
      saleStartAt,
      saleEndAt,
    }
  })
  const count = await Product.countDocuments(filter);
  ApiResponse
    .success(`Successfully applied ${discount}% discount to ${count} products`)
    .send(res);
}

/** Xóa discount hàng loạt */
export const removeBulkDiscount = async (req, res) => {
  const { productIds } = req.body
  const filter = productIds?.length ? { _id: { $in: productIds } } : {}
  await Product.updateMany(filter, {
    $set: { discount: 0, saleStartAt: null, saleEndAt: null }
  })
  ApiResponse.success("Deleted discount Successfully").send(res);
}
