// backend/controllers/marketing.controller.js
import Subscriber from "../models/Subscriber.js"
import Product from "../models/Product.js"
import { sendPromotionEmail } from "../services/emailService.js"

/** Gửi email khuyến mãi chỉ cho Subscriber đã đăng ký */
export const sendBulkPromo = async (req, res) => {
  try {
    const { subject, promoCode, productIds } = req.body

    let products = []
    if (productIds && productIds.length > 0) {
      products = await Product.find({ _id: { $in: productIds } })
        .select("_id name price images discount saleStartAt saleEndAt")
    } else {
      // Lấy 6 sản phẩm đang sale
      products = await Product.find({ discount: { $gt: 0 } })
        .sort({ discount: -1 }).limit(6)
    }

    // Gắn salePrice
    const now = new Date()
    const productsWithSale = products.map(p => {
      const obj = p.toObject({ virtuals: true })
      const inSale = p.discount > 0 &&
        (!p.saleStartAt || p.saleStartAt <= now) &&
        (!p.saleEndAt || p.saleEndAt >= now)
      obj.salePrice = inSale ? Math.round(p.price * (1 - p.discount / 100)) : p.price
      return obj
    })

    // ✅ Chỉ gửi cho Subscriber đang active
    const subscribers = await Subscriber.find({ isActive: true }).select("name email")

    if (!subscribers.length) {
      return res.status(200).json({
        success: true,
        message: "Không có subscriber nào để gửi",
        data: { sent: 0, failed: 0, total: 0 }
      })
    }

    let sent = 0, failed = 0
    for (const sub of subscribers) {
      try {
        await sendPromotionEmail({
          to: sub.email,
          name: sub.name || "Khách hàng",
          subject: subject || "🔥 Ưu đãi đặc biệt từ ABC Shop!",
          products: productsWithSale,
          promoCode,
        })
        sent++
      } catch {
        failed++
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã gửi ${sent} email, ${failed} lỗi`,
      data: { sent, failed, total: subscribers.length }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/** Áp dụng discount hàng loạt cho nhiều sản phẩm */
export const applyBulkDiscount = async (req, res) => {
  try {
    const { productIds, discount, saleStartAt, saleEndAt } = req.body

    if (discount < 0 || discount > 100)
      return res.status(400).json({ success: false, message: "Discount phải từ 0-100" })

    const filter = productIds?.length ? { _id: { $in: productIds } } : {}

    await Product.updateMany(filter, {
      $set: {
        discount: Number(discount),
        saleStartAt: saleStartAt ? new Date(saleStartAt) : null,
        saleEndAt:   saleEndAt   ? new Date(saleEndAt)   : null,
      }
    })

    const count = await Product.countDocuments(filter)
    res.status(200).json({
      success: true,
      message: `Đã áp dụng ${discount}% cho ${count} sản phẩm`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/** Xóa discount hàng loạt */
export const removeBulkDiscount = async (req, res) => {
  try {
    const { productIds } = req.body
    const filter = productIds?.length ? { _id: { $in: productIds } } : {}

    await Product.updateMany(filter, {
      $set: { discount: 0, saleStartAt: null, saleEndAt: null }
    })

    res.status(200).json({ success: true, message: "Đã xóa discount thành công" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
