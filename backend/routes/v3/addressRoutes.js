import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import catchAsync from "../../middleware/catchAsync.js";
import { districts, provinces, wards } from "../../controllers/address.controller.js";
import {v3AddAddr} from "../../controllers/user.controller.js";
const addrRoutes = express.Router();
addrRoutes.use(protect);

addrRoutes.get("/provinces", catchAsync(provinces));
addrRoutes.get("/districts/:provinceId", catchAsync(districts));
addrRoutes.get("/wards/:districtId", catchAsync(wards));
addrRoutes.post("/user", catchAsync(v3AddAddr));

export default addrRoutes;


