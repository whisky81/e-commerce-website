import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import catchAsync from "../../middleware/catchAsync.js";
import { districts, provinces, wards } from "../../controllers/address.controller.js";
import { getUserAddressesV3, v3AddAddr, v3UpdateAddr, v3DeleteAddrs } from "../../controllers/user.controller.js";

const addrRoutes = express.Router();
addrRoutes.use(protect);

// 3-level lookup
addrRoutes.get("/provinces", catchAsync(provinces));
addrRoutes.get("/districts/:provinceId", catchAsync(districts));
addrRoutes.get("/wards/:districtId", catchAsync(wards));

// CRUD user addresses
addrRoutes.get("/user", catchAsync(getUserAddressesV3));
addrRoutes.post("/user", catchAsync(v3AddAddr));
addrRoutes.put("/user/:addressId", catchAsync(v3UpdateAddr));
addrRoutes.delete("/user", catchAsync(v3DeleteAddrs));

export default addrRoutes;

