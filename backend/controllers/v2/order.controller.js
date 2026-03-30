// backend/controllers/v2/order.controller.js
// Chỉ thay đổi phần tính giá sản phẩm - dùng salePrice thay vì price gốc

import Stripe from "stripe";
import Order from "../../models/v2/Order.js";
import Product from "../../models/v2/Product.js";
import User from "../../models/v2/User.js";
import mongoose from "mongoose";

const shippingPrice = 20000;
const currency = "vnd";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Lấy giá hiệu quả (có discount) */
const getEffectivePrice = (product) => {
    const now = new Date();
    const inSale =
        product.discount > 0 &&
        (!product.saleStartAt || product.saleStartAt <= now) &&
        (!product.saleEndAt   || product.saleEndAt   >= now);
    return inSale ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
};

// ─── Shared helper: validate & build line items ──────────────────────────────
const buildLineItems = async (orderItems) => {
    let itemsPrice = 0;
    const lineItems = [];

    for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (!product) throw { status: 404, message: "Không tìm thấy sản phẩm" };
        if (product.stock < item.quantity) throw { status: 400, message: `Không đủ hàng: ${product.name}` };

        const effectivePrice = getEffectivePrice(product);
        itemsPrice += effectivePrice * item.quantity;
        lineItems.push({
            product: item.product,
            quantity: item.quantity,
            name: product.name,
            image: product.images[0],
            price: effectivePrice,          // ← giá đã giảm
            originalPrice: product.price,   // ← giá gốc (lưu để tham khảo)
        });
    }
    return { itemsPrice, lineItems };
};

// ─── COD ─────────────────────────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        let { addressId, orderItems } = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId))
            return res.status(400).json({ success: false, message: "Invalid address ID" });

        const address = req.user.addresses.id(addressId);
        if (!address) return res.status(404).json({ success: false, message: "Address not found" });

        let ordersInCartFlag = orderItems == undefined;
        if (ordersInCartFlag) {
            orderItems = req.user.cart;
        } else {
            orderItems = orderItems
                .map(item => {
                    if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product)) return undefined;
                    return { product: item.product, quantity: item.quantity };
                })
                .filter(Boolean);
        }

        if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

        const { itemsPrice, lineItems } = await buildLineItems(orderItems);

        const session = await mongoose.startSession();
        let newOrderId;
        try {
            await session.withTransaction(async () => {
                const [created] = await Order.create([{
                    user: userId,
                    items: lineItems,
                    shippingAddress: { fullName: address.fullName, phone: address.phone, street: address.street, ward: address.ward, district: address.district, province: address.province },
                    itemsPrice, shippingPrice,
                    totalPrice: itemsPrice + shippingPrice,
                }], { session });
                newOrderId = created._id;

                for (const item of orderItems) {
                    const updated = await Product.findOneAndUpdate(
                        { _id: item.product, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
                        { session, new: true }
                    );
                    if (!updated) throw new Error("INSUFFICIENT_STOCK");
                }
                if (ordersInCartFlag) await User.findByIdAndUpdate(userId, { cart: [] }, { session });
            });
        } catch (err) {
            if (err.message === "INSUFFICIENT_STOCK")
                return res.status(400).json({ success: false, message: "Không đủ hàng trong kho" });
            throw err;
        } finally {
            session.endSession();
        }

        res.status(201).json({ success: true, message: "Đặt hàng thành công", data: { orderId: newOrderId } });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.user._id;
        let { addressId, orderItems } = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId))
            return res.status(400).json({ success: false, message: "Invalid address ID" });

        const address = req.user.addresses.id(addressId);
        if (!address) return res.status(404).json({ success: false, message: "Address not found" });

        let ordersInCartFlag = orderItems == undefined;
        if (ordersInCartFlag) {
            orderItems = req.user.cart;
        } else {
            orderItems = orderItems.map(item => {
                if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product)) return undefined;
                return { product: item.product, quantity: item.quantity };
            }).filter(Boolean);
        }

        if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

        const { itemsPrice, lineItems } = await buildLineItems(orderItems);

        const newOrder = await Order.create({
            user: userId, items: lineItems,
            shippingAddress: { fullName: address.fullName, phone: address.phone, street: address.street, ward: address.ward, district: address.district, province: address.province },
            itemsPrice, shippingPrice,
            totalPrice: itemsPrice + shippingPrice,
            paymentMethod: "stripe",
        });

        const stripeItems = lineItems.map(item => ({
            price_data: { currency, product_data: { name: item.name }, unit_amount: item.price },
            quantity: item.quantity,
        }));
        stripeItems.push({ price_data: { currency, product_data: { name: "Shipping Fee" }, unit_amount: shippingPrice }, quantity: 1 });

        const { origin } = req.headers;
        const stripeSession = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            mode: "payment", line_items: stripeItems,
        });

        res.status(201).json({ success: true, data: { session_url: stripeSession.url } });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Admin: list all orders ───────────────────────────────────────────────────
export const ordersList = async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user","name email").sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const userOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(orderId))
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        await Order.findByIdAndUpdate(orderId, { status });
        res.status(200).json({ success: true, message: "Order status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyStripe = async (req, res) => {
    try {
        const { orderId, success } = req.body;
        if (!mongoose.Types.ObjectId.isValid(orderId))
            return res.status(400).json({ success: false, message: "Invalid order ID" });

        if (success === "true") {
            let session;
            try {
                session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const order = await Order.findById(orderId).session(session);
                    if (!order) throw new Error("ORDER_NOT_FOUND");
                    if (order.user.toString() !== req.user._id.toString()) throw new Error("FORBIDDEN_ORDER");
                    if (order.isPaid) return;

                    for (const line of order.items) {
                        const updated = await Product.findOneAndUpdate(
                            { _id: line.product, stock: { $gte: line.quantity } },
                            { $inc: { stock: -line.quantity, soldCount: line.quantity } },
                            { session, new: true }
                        );
                        if (!updated) throw new Error("INSUFFICIENT_STOCK");
                    }
                    order.isPaid = true; order.paidAt = new Date(); order.status = "confirmed";
                    await order.save({ session });
                    await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });
                });
            } catch (err) {
                if (err.message === "INSUFFICIENT_STOCK") return res.status(400).json({ success: false, message: "Không đủ hàng trong kho" });
                if (err.message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
                if (err.message === "FORBIDDEN_ORDER") return res.status(403).json({ success: false, message: "Không hợp lệ" });
                throw err;
            } finally { session?.endSession(); }
            return res.json({ success: true, message: "Thanh toán thành công" });
        } else {
            await Order.findByIdAndDelete(orderId);
            res.status(400).json({ success: false, message: "Thanh toán thất bại, đơn hàng đã hủy" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
