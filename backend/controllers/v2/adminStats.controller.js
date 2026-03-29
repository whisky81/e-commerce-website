import Order from "../../models/v2/Order.js";
import Product from "../../models/v2/Product.js";
import User from "../../models/v2/User.js";

const LOW_STOCK_THRESHOLD = 10;

export const adminStats = async (req, res) => {
    try {
        const [
            orderCount,
            revenueAgg,
            productCount,
            userCount,
            soldSum,
            topProducts,
            lowStock
        ] = await Promise.all([
            Order.countDocuments({ status: { $ne: "cancelled" } }),
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
                .sort({ soldCount: -1 })
                .limit(8)
                .select("_id name price images soldCount stock category"),
            Product.find({
                stock: { $lte: LOW_STOCK_THRESHOLD, $gte: 0 }
            })
                .sort({ stock: 1 })
                .limit(12)
                .select("_id name stock soldCount images category")
        ]);

        const revenue = revenueAgg[0]?.total ?? 0;
        const totalSoldUnits = soldSum[0]?.total ?? 0;

        res.status(200).json({
            success: true,
            data: {
                orderCount,
                revenue,
                productCount,
                userCount,
                totalSoldUnits,
                topProducts,
                lowStockProducts: lowStock,
                lowStockThreshold: LOW_STOCK_THRESHOLD
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
