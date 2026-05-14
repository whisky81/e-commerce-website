import shippingProvider from "../../config/shipping.js";
import Order from "../../models/Order.js";
import ShippingOrder from "../../models/ShippingOrder.js";
import mongoose, { Mongoose } from "mongoose";
import ApiResponse from "../../utils/ApiResponse.js";
import ValidationError from "../../errors/ValidationError.js";

/**
 * {
    "success": [
        {
        "orderId": "...",
        "shippingOrderCode": "GHN123"
        }
    ],

    "failed": [
        {
        "orderId": "...",
        "reason": "Already shipped"
        }
    ]
    }
 */
// POST /api/v3/admin/shipping-orders/bulk-create
export const bulkCreateShippingOrder = async (req, res) => {
    const { orderIds } = req.body; 
    if (!Array.isArray(orderIds) 
        || orderIds.length === 0 
    || !orderIds.every(id=>mongoose.Types.ObjectId.isValid(id))) {
        throw new ValidationError("Invalid order id");
    }
    const orders = await Order
        .find({_id: {$in: orderIds}})
        .populate("user", "name")
        .lean();

    const shippingOrders = await Promise.allSettled(
        orders.map(async (order)=> (await shippingProvider.placeOrder(0, order)))
    );
}