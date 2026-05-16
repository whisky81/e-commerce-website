import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true 
    },
    url: {
        type: String,
        required: true 
    },
    isActive: {
        type: Boolean,
        default: false
    }
})

const settingSchema = new mongoose.Schema({
    banners: [bannerSchema],
    lowStockThreshold: {
        type: Number,
        min: 1,
        default: 10
    }
}, {
    timestamps: true,
    minimize: false 
})

export default mongoose.model("Setting", settingSchema); 