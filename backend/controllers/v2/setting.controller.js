import Setting from "../../models/v2/Setting.js";
import { v2 as cloudinary } from "cloudinary"

const settingId = "69c938ee2ad8114c4c5f26ac";

export const config = async (req, res) => {
    try {
        const _config = await Setting.findById(settingId);
        res.status(200).json({
            success: true,
            data: _config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const addNewBanner = async (req, res) => {
    try {
        const _config = await Setting.findById(settingId);
        const img = req.files.img && req.files.img[0];
        const { name } = req.body;
        if (!img) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }
        const result = await cloudinary.uploader.upload(img.path, {
            resource_type: 'image'
        })
        
        if (!_config) {
            const newConfig = new Setting({
                banners: [{
                    name: "Banner 1",
                    url: result.secure_url,
                    isActive: true
                }]
            });
            await newConfig.save(); 
        }
        const newBanner = {
            name: name || `Banner ${_config.banners.length + 1}`,
            url: result.secure_url,
            isActive: _config.banners.length === 0 
        }
        _config.banners.push(newBanner);
        await _config.save();
        res.status(200).json({
            success: true,
            data: newBanner
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const chooseBanner = async (req, res) => {
    try {
        const { index } = req.params;
        const _config = await Setting.findById(settingId);
        if (!_config) {
            return res.status(404).json({
                success: false,
                message: "Config not found"
            });
        }
        if (index < 0 || index >= _config.banners.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid banner index"
            });
        }
        _config.banners.forEach((banner, i) => {
            banner.isActive = i === parseInt(index);
        });
        await _config.save();
        res.status(200).json({
            success: true,
            message: "Banner updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}