import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import catchAsync from "../../middleware/catchAsync.js";
import {placeOrderStripeV3, placeOrderV3, previewOrder,stripeCheckoutSession, beforeOrder} from "../../controllers/order.controller.js";

const orderRoutes = express.Router();
orderRoutes.use(protect);


orderRoutes.post("/orders/preview", catchAsync(previewOrder));

orderRoutes.post("/orders/cod/create", catchAsync(beforeOrder), catchAsync(placeOrderV3)); 

// TODO
orderRoutes.post("/orders/stripe/create", catchAsync(beforeOrder), catchAsync(placeOrderStripeV3));
orderRoutes.post("/payments/stripe/checkout-session", catchAsync(stripeCheckoutSession));



export default orderRoutes;