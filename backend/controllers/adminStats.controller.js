// backend/controllers/v2/adminStats.controller.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Setting from "../models/Setting.js";
import ApiResponse from "../utils/ApiResponse.js";

function buildDateRanges(startDate, endDate) {
    const now = new Date();
    const currentEnd   = endDate   ? new Date(endDate)   : now;
    const currentStart = startDate ? new Date(startDate) : new Date(now - 30 * 24 * 60 * 60 * 1000);
    const durationMs   = currentEnd - currentStart;
    const prevEnd      = new Date(currentStart - 1);
    const prevStart    = new Date(prevEnd - durationMs);
    return {
        current: { $gte: currentStart, $lte: currentEnd },
        prev:    { $gte: prevStart,    $lte: prevEnd    },
    };
}

function pctChange(current, previous) {
    if (previous === 0 || previous == null) return null;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export const adminStats = async (req, res) => {
    const topProductsLimit      = 8;
    const lowStockProductsLimit = 12;
    const { startDate, endDate } = req.query;

    let currentMatch = {};
    let prevMatch    = {};
    let currentRange = null; // Fix 1: declare here so ApiResponse can access it
    let prevRange    = null;
    const allOfTime  = !(startDate || endDate);

    if (!allOfTime) {
        const ranges = buildDateRanges(startDate, endDate);
        currentRange = ranges.current;
        prevRange    = ranges.prev;
        currentMatch = { createdAt: currentRange };
        prevMatch    = { createdAt: prevRange };
    }

    // ─── Settings ─────────────────────────────────────────────────────────────
    const setting = await Setting.find({})
        .select("_id lowStockThreshold createdAt updatedAt banners")
        .lean();
    const lowStockThreshold = setting[0]?.lowStockThreshold ?? 10;

    // ─── Previous period queries (skipped when no date filter) ────────────────
    let prevOrderCount     = null;
    let prevRevenueAgg     = null;
    let prevPaidRevenueAgg = null;
    let prevSoldSum        = null;
    let prevUserCount      = null;

    if (!allOfTime) {
        [
            prevOrderCount,
            prevRevenueAgg,
            prevPaidRevenueAgg,
            prevSoldSum,
            prevUserCount,
        ] = await Promise.all([
            Order.countDocuments({ status: { $ne: "cancelled" }, ...prevMatch }),

            Order.aggregate([
                { $match: { status: { $ne: "cancelled" }, ...prevMatch } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),

            Order.aggregate([
                { $match: { isPaid: true, ...prevMatch } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),

            Order.aggregate([
                { $match: { status: { $ne: "cancelled" }, ...prevMatch } },
                { $unwind: "$items" },
                { $group: { _id: null, total: { $sum: "$items.quantity" } } }
            ]),

            User.countDocuments({ role: "user", ...prevMatch }),
        ]);
    }

    // ─── Current period queries ───────────────────────────────────────────────
    const [
        orderCount,
        revenueAgg,
        paidRevenueAgg,
        soldSum,
        statusAgg,
        productCount,
        userCount,
        topProducts,
        lowStock,
    ] = await Promise.all([
        Order.countDocuments({ status: { $ne: "cancelled" }, ...currentMatch }),

        Order.aggregate([
            { $match: { status: { $ne: "cancelled" }, ...currentMatch } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),

        Order.aggregate([
            { $match: { isPaid: true, ...currentMatch } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),

        Order.aggregate([
            { $match: { status: { $ne: "cancelled" }, ...currentMatch } },
            { $unwind: "$items" },
            { $group: { _id: null, total: { $sum: "$items.quantity" } } }
        ]),

        Order.aggregate([
            { $match: { ...currentMatch } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),

        Product.countDocuments({}),
        User.countDocuments({ role: "user" }),

        Product.find({ soldCount: { $gt: 0 } })
            .sort({ soldCount: -1 }).limit(topProductsLimit)
            .select("_id name price images soldCount stock category discount"),

        Product.find({ stock: { $lte: lowStockThreshold, $gte: 0 } })
            .sort({ stock: 1 }).limit(lowStockProductsLimit)
            .select("_id name stock soldCount images category"),
    ]);

    // ─── Scalars ──────────────────────────────────────────────────────────────
    const revenue        = revenueAgg[0]?.total    ?? 0;
    const paidRevenue    = paidRevenueAgg[0]?.total ?? 0;
    const totalSoldUnits = soldSum[0]?.total        ?? 0;

    // Fix 2: use ternary, not &&. When allOfTime, these stay null (no baseline).
    const prevRevenue     = allOfTime ? null : (prevRevenueAgg?.[0]?.total     ?? 0);
    const prevPaidRevenue = allOfTime ? null : (prevPaidRevenueAgg?.[0]?.total ?? 0);
    const prevSoldUnits   = allOfTime ? null : (prevSoldSum?.[0]?.total        ?? 0);

    // ─── Status breakdown ─────────────────────────────────────────────────────
    const statusCounts = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 };
    statusAgg.forEach(({ _id, count }) => {
        if (_id in statusCounts) statusCounts[_id] = count;
    });

    // Fix 3: use ternary, not &&. changes is an object or null, never false/true.
    const changes = allOfTime ? null : {
        orderCount:     pctChange(orderCount,     prevOrderCount),
        revenue:        pctChange(revenue,        prevRevenue),
        paidRevenue:    pctChange(paidRevenue,    prevPaidRevenue),
        userCount:      pctChange(userCount,      prevUserCount),
        totalSoldUnits: pctChange(totalSoldUnits, prevSoldUnits),
    };

    // ─── Response ─────────────────────────────────────────────────────────────
    const stats = {
        orderCount,
        revenue,
        paidRevenue,
        productCount,
        userCount,
        totalSoldUnits,
        topProducts,
        lowStockProducts: lowStock,
        lowStockThreshold,
        statusCounts,
        changes, // null when allOfTime, object with % values when filtered
    };

    new ApiResponse(
        true,
        200,
        'Success',
        { setting: setting[0], stats },
        {
            period: allOfTime ? null : { current: currentRange, prev: prevRange },
            topProductsLimit,
            lowStockProductsLimit,
        }
    ).send(res);
};