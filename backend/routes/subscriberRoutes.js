// backend/routes/subscriberRoutes.js
import express from "express";
import Subscriber from "../models/Subscriber.js";
import { protect } from "../middleware/auth.middleware.js";
import catchAsync from "../middleware/catchAsync.js";
import { register, unsubscribe } from "../controllers/subscriber.controller.js";

const subscriberRoutes = express.Router();

subscriberRoutes.post("/", catchAsync(register));
subscriberRoutes.post("/unsubscribe", protect, catchAsync(unsubscribe));

export default subscriberRoutes;
