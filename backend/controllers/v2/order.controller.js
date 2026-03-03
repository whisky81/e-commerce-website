import Stripe from "stripe";
import Order from "../../models/v2/Order.js"
import Product from "../../models/v2/Product.js"
import User from "../../models/v2/User.js"
import mongoose from "mongoose";

const shippingPrice = 20000;
const currency = "vnd"
const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
)

export const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        let {
            addressId,
            orderItems
        } = req.body;
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            })
        }
        const address = req.user
            .addresses
            .id(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            })
        }

        let ordersInCartFlag = orderItems == undefined;
        if (ordersInCartFlag) {
            orderItems = req.user.cart;
        } else {
            orderItems = orderItems.map((item) => {
                if (
                    !item.product
                    || !item.quantity
                    || item.quantity < 1
                    || !mongoose.Types.ObjectId.isValid(item.product)) {
                    return undefined;
                }
                return {
                    product: item.product,
                    quantity: item.quantity
                }
            }).filter((item) => item !== undefined);
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            })
        }
        let itemsPrice = 0;
        orderItems = await Promise.all(
            orderItems.map(async (item) => {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    })
                }
                itemsPrice += product.price * item.quantity;
                return {
                    product: item.product,
                    quantity: item.quantity,
                    name: product.name,
                    image: product.images[0],
                    price: product.price,
                }
            })
        )
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const newOrder = await Order.create({
                user: userId,
                items: orderItems,
                shippingAddress: {
                    fullName: address.fullName,
                    phone: address.phone,
                    street: address.street,
                    ward: address.ward,
                    district: address.district,
                    province: address.province
                },
                itemsPrice,
                shippingPrice,
                totalPrice: itemsPrice + shippingPrice,
            })
            ordersInCartFlag && (await User.findByIdAndUpdate(
                userId,
                { cart: [] }));
            await session.commitTransaction();
            res.status(201).json({
                success: true,
                message: "Order Placed Successfully",
                data: {
                    orderId: newOrder._id,
                }
            })
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.user._id;
        let {
            addressId,
            orderItems
        } = req.body;
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            })
        }
        const address = req.user
            .addresses
            .id(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            })
        }

        let ordersInCartFlag = orderItems == undefined;
        if (ordersInCartFlag) {
            orderItems = req.user.cart;
        } else {
            orderItems = orderItems.map((item) => {
                if (
                    !item.product
                    || !item.quantity
                    || item.quantity < 1
                    || !mongoose.Types.ObjectId.isValid(item.product)) {
                    return undefined;
                }
                return {
                    product: item.product,
                    quantity: item.quantity
                }
            }).filter((item) => item !== undefined);
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            })
        }
        let itemsPrice = 0;
        orderItems = await Promise.all(
            orderItems.map(async (item) => {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    })
                }
                itemsPrice += product.price * item.quantity;
                return {
                    product: item.product,
                    quantity: item.quantity,
                    name: product.name,
                    image: product.images[0],
                    price: product.price,
                }
            })
        )
        const orderData = {
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                street: address.street,
                ward: address.ward,
                district: address.district,
                province: address.province
            },
            itemsPrice,
            shippingPrice,
            totalPrice: itemsPrice + shippingPrice,
            paymentMethod: "stripe"
        }
        const newOrder = await Order.create(orderData);
        const line_items = orderItems.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price,

            },
            quantity: item.quantity
        }))
        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Shipping Fee",
                },
                unit_amount: shippingPrice,

            },
            quantity: 1
        })
        const { origin } = req.headers;
        const session = await stripe.checkout.sessions.create(
            {
                success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
                cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
                mode: "payment",
                line_items
            }
        )
        res.status(201).json({
            success: true,
            data: {
                session_url: session.url
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const ordersList = async (req, res) => {
    try {
        const orders = await Order
            .find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: orders
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const userOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order
            .find({ user: userId })
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            })
        }
        await Order.findByIdAndUpdate(
            orderId,
            { status }
        )
        res.status(200).json({
            success: true,
            message: "Order status updated"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const verifyStripe = async (req, res) => {
    try {
        const { orderId, success } = req.body;
        if (success === "true") {
            await Order.findByIdAndUpdate(
                orderId,
                {
                    isPaid: true,
                    paidAt: Date.now(),
                    status: "confirmed"
                }
            )
            await User.findByIdAndUpdate(
                req.user._id,
                { cart: [] })
            res.json({
                success: true,
                message: "Payment verified and order placed successfully"
            })
        } else {
            await Order.findByIdAndDelete(orderId);
            res.status(400).json({
                success: false,
                message: "Payment failed, order cancelled"
            })

        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
