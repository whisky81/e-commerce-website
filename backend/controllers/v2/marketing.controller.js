// backend/controllers/v2/marketing.controller.js
import User from "../../models/v2/User.js"
import Product from "../../models/v2/Product.js"
import { sendPromotionEmail } from "../../services/emailService.js"

/** Gửi email khuyến mãi đến tất cả user */
export const sendBulkPromo = async (req, res) => {
    try {
        const { subject, promoCode, productIds, discountPercent } = req.body

        // Nếu có discountPercent → tự động gắn discount cho sản phẩm được chọn
        let products = []
        if (productIds && productIds.length > 0) {
            products = await Product.find({ _id: { $in: productIds } }).select("_id name price images discount saleStartAt saleEndAt")
        } else {
            // Lấy 6 sản phẩm đang sale
            products = await Product.find({ discount: { $gt: 0 } }).sort({ discount: -1 }).limit(6)
        }

        // Thêm salePrice
        const now = new Date()
        const productsWithSale = products.map(p => {
            const obj = p.toObject({ virtuals: true })
            const inSale = p.discount > 0 && (!p.saleStartAt || p.saleStartAt <= now) && (!p.saleEndAt || p.saleEndAt >= now)
            obj.salePrice = inSale ? Math.round(p.price * (1 - p.discount / 100)) : p.price
            return obj
        })

        // Lấy tất cả user
        const users = await User.find({ role: "user", isActive: true }).select("name email")

        let sent = 0, failed = 0
        for (const user of users) {
            try {
                await sendPromotionEmail({
                    to: user.email,
                    name: user.name,
                    subject,
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
            data: { sent, failed, total: users.length }
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
        res.status(200).json({ success: true, message: `Đã áp dụng ${discount}% cho ${count} sản phẩm` })
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

        res.status(200).json({ success: true, message: "Đã xóa discount" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
