// backend/controllers/v2/adminStats.controller.js
import Order from "../../models/v2/Order.js";
import Product from "../../models/v2/Product.js";
import User from "../../models/v2/User.js";

const LOW_STOCK_THRESHOLD = 10;

export const adminStats = async (req, res) => {
    try {
        const [
            orderCount,
            revenueAgg,       // ← tổng doanh thu từ totalPrice (đã bao gồm giá discount)
            productCount,
            userCount,
            soldSum,
            topProducts,
            lowStock,
            // Thống kê theo trạng thái
            statusAgg,
        ] = await Promise.all([
            // ✅ Đếm đơn hàng không bị hủy
            Order.countDocuments({ status: { $ne: "cancelled" } }),

            // ✅ Doanh thu thực tế (chỉ từ đơn ĐÃ THANH TOÁN hoặc COD không hủy)
            Order.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),

            Product.countDocuments({}),
            User.countDocuments({ role: "user" }),

            Product.aggregate([
                { $group: { _id: null, total: { $sum: "$soldCount" } } }
            ]),

            Product.find({ soldCount: { $gt: 0 } })
                .sort({ soldCount: -1 }).limit(8)
                .select("_id name price images soldCount stock category discount"),

            Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD, $gte: 0 } })
                .sort({ stock: 1 }).limit(12)
                .select("_id name stock soldCount images category"),

            // ✅ Thống kê số đơn theo từng trạng thái
            Order.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
        ]);

        const revenue = revenueAgg[0]?.total ?? 0;
        const totalSoldUnits = soldSum[0]?.total ?? 0;

        // Format status counts
        const statusCounts = {
            pending:   0,
            confirmed: 0,
            shipping:  0,
            delivered: 0,
            cancelled: 0,
        };
        statusAgg.forEach(({ _id, count }) => {
            if (_id in statusCounts) statusCounts[_id] = count;
        });

        // ✅ Doanh thu đã thực thu (chỉ đơn isPaid = true)
        const [paidRevenueAgg] = await Promise.all([
            Order.aggregate([
                { $match: { isPaid: true } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
        ]);
        const paidRevenue = paidRevenueAgg[0]?.total ?? 0;

        res.status(200).json({
            success: true,
            data: {
                orderCount,
                revenue,          // tổng từ đơn không hủy
                paidRevenue,      // ✅ chỉ đơn đã thanh toán
                productCount,
                userCount,
                totalSoldUnits,
                topProducts,
                lowStockProducts: lowStock,
                lowStockThreshold: LOW_STOCK_THRESHOLD,
                statusCounts,     // ✅ thêm breakdown theo trạng thái
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
