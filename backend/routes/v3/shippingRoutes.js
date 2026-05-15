import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import catchAsync from "../../middleware/catchAsync.js";
import { estimateFee, getEta } from "../../controllers/shipping.controller.js";

const shippingRoutes = express.Router();
shippingRoutes.use(protect);

shippingRoutes.get("/eta", catchAsync(getEta));
shippingRoutes.post("/estimate-fee", catchAsync(estimateFee));

export default shippingRoutes;
