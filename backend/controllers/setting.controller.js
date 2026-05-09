import Setting from "../models/Setting.js";
import { v2 as cloudinary } from "cloudinary"
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ValidationError from "../errors/ValidationError.js";

export const config = async (req, res) => {
    const settings = await Setting
        .find({})
        .select("_id lowStockThreshold createdAt updatedAt banners")
        .lean();
    ApiResponse.success("Success", { ...settings[0] }).send(res);
}

export const addNewBanner = async (req, res) => {
    const img = req.files.img && req.files.img[0];
    const { name } = req.body;
    if (!img) {
        throw new AppError("Image is required", 400, "IMAGE_IS_REQUIRED");
    }
    const result = await cloudinary.uploader.upload(img.path, {
        resource_type: 'image'
    })

    const settings = await Setting.find({});
    let setting = settings[0];

    if (!setting) {
        setting = await Setting.create({
            banners: [{
                name: name?.trim() || "Banner 1",
                url: result.secure_url,
                isActive: true
            }]
        });
    } else {
        const newBanner = {
            name: name?.trim() || `Banner ${setting.banners.length + 1}`,
            url: result.secure_url,
            isActive: setting.banners.length === 0
        }
        setting.banners.push(newBanner);
        await setting.save();
    }
    ApiResponse.created(setting.banners[setting.banners.length - 1]).send(res);
}

export const chooseBanner = async (req, res) => {
    let { index } = req.params;
    index = parseInt(index);

    const settings = await Setting.find();
    const setting = settings[0];
    if (!setting) {
        throw new NotFoundError("Setting not found");
    }
    if (index < 0 || index >= setting.banners.length) {
        throw new ValidationError("Invalid banner index");
    }
    setting.banners.forEach((banner, i) => {
        banner.isActive = i === index;
    });
    await setting.save();
    ApiResponse.success("Banner updated successfully").send(res);
}