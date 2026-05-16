import shippingProvider from "../config/shipping.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
export const provinces = async (req, res) => {
    const data = await shippingProvider.provinces();
    new ApiResponse(
        data.success, 
        data.success ? 200 : 400, 
        data.message, 
        data.data || [], 
        null)
        .send(res);
}

export const districts = async (req, res) => {
    const { provinceId } = req.params;
    if (isNaN(Number(provinceId))) throw new AppError("Invalid province id", 400);
    const data = await shippingProvider.districts(Number(provinceId));
    new ApiResponse(
        data.success, 
        data.success ? 200 : 400, 
        data.message, 
        data.data || [], 
        null)
        .send(res);
}

export const wards = async (req, res) => {
    const { districtId } = req.params; 
     if (isNaN(Number(districtId))) throw new AppError("Invalid district id", 400);
     const data = await shippingProvider.wards(Number(districtId));
     new ApiResponse(
        data.success, 
        data.success ? 200 : 400, 
        data.message, 
        data.data || [], 
        null)
        .send(res);
}