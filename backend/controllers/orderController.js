import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe"

const currency = "vnd"
const deleveryCharges = 20000

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
)

// cod 
const placeOrder = async (req, res) => {
    try {
        const {
            userId,
            items,
            amount,
            address
        } = req.body;
        const orderData = {
            userId,
            items,
            amount,
            paymentMethod: "COD",
            payment: false,
            date: Date.now(),
            address
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({
            success: true,
            message: "Order Placed Successfully"
        })


    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}
// stripe 
const placeOrderStripe = async (req, res) => {
    try {
        const {
            userId,
            items,
            amount,
            address
        } = req.body;
        const { origin } = req.headers
        const orderData = {
            userId,
            items,
            amount,
            paymentMethod: "Stripe",
            payment: false,
            date: Date.now(),
            address
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 1000,

            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delevery Charges",
                },
                unit_amount: deleveryCharges * 100,

            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create(
            {
                success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
                cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
                mode: "payment",
                line_items
            }
        )
        res.json({
            success: true,
            session_url: session.url
        })

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({
            success: true,
            orders
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({
            success: true,
            orders
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body
        await orderModel.findByIdAndUpdate(
            orderId,
            { status }
        )
        res.json({
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

const verifyStripe = async (req, res) => {
    try {
        const { orderId, success, userId } = req.body
        if (success === "true") {
            await orderModel.findByIdAndUpdate(
                orderId,
                { payment: true }
            )
            await userModel.findByIdAndUpdate(userId, { cartData: {} })
            res.json({
                success: true,
                message: "Payment verified and order placed successfully"
            })
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({
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

export {
    placeOrder,
    placeOrderStripe,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe
}