import shippingProvider from "../../config/shipping.js";
import Order from "../../models/Order.js";
import ShippingOrder from "../../models/ShippingOrder.js";
import mongoose from "mongoose";
import ApiResponse from "../../utils/ApiResponse.js";
import ValidationError from "../../errors/ValidationError.js";
import ThirdPartyServiceError from "../../errors/ThirdPartyServiceError.js";
import logger from "../../config/Logger.js";
export const bulkCreateShippingOrder = async (req, res) => {
    const { bulk: orderIds } = req.body;
    if (!Array.isArray(orderIds)
        || orderIds.length === 0
        || !orderIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new ValidationError("Invalid order id");
    }
    const orders = await Order
        .find({ _id: { $in: orderIds } })
        .populate("user", "name")
        .lean();

    const session = await mongoose.startSession();
    const shippingOrders = await Promise.allSettled(
            orders.map(async (order) => (await shippingProvider.placeOrder(0, order)))
        );
        const successfulShippingOrders = shippingOrders.map(order => {
            if (order.status === "rejected") return null;
            return order.value;
        }).filter(Boolean);
        let tmp = [];
    try {
        await session.withTransaction(async () => {
            tmp = await ShippingOrder.create(successfulShippingOrders, { session, ordered: true });
            await Promise.all(tmp.map(o => Order.findByIdAndUpdate(o.order, { status: 'confirmed' }, { session })));
        });
    } catch(err) {
        // cancel order 
        try {
            const cancelRes = await shippingProvider.cancelOrder(0, successfulShippingOrders.map(o=>o.providerOrderCode));
            if (!cancelRes) throw new ThirdPartyServiceError("Cancel order", "ghn");   
        } catch (error) {
            logger.error("ghn cancel failed for orders");
        }
        throw err;
    } 
    finally {
        session.endSession();
        
    }

    new ApiResponse(true, 200, "", {
        success: tmp.length,
        failed: orderIds.length - tmp.length
    }).send(res);
}