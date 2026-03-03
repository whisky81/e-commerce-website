import express from "express";
import { 
    protect, 
    adminOnly 
} from "../../middleware/v2/auth.middleware.js";
import { 
    placeOrder,
    placeOrderStripe,
    ordersList,
    userOrders,
    updateStatus,
    verifyStripe,
} from "../../controllers/v2/order.controller.js";

const orderRoutes = express.Router()

orderRoutes.get('/', protect, adminOnly, ordersList) //
orderRoutes.put('/status', protect, adminOnly, updateStatus) // 

orderRoutes.post('/place', protect, placeOrder) // 
orderRoutes.post('/stripe', protect, placeOrderStripe) // 
orderRoutes.get('/my', protect, userOrders) //
orderRoutes.post('/verify-stripe', protect, verifyStripe) //


export default orderRoutes