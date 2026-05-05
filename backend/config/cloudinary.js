import { v2 as cloudinary } from 'cloudinary';
import logger from "./Logger.js";


const connectCloudinary = async () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    } catch (error) {
        logger.error('ThirdPartyServiceError', {
            message: error.message,
            stack: error.stack,
            serviceName: 'cloudinary'
        });
    }
}

export default connectCloudinary
