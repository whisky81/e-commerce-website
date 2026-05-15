import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { v2 as cloudinary } from "cloudinary";
import MissingRequiredFieldError from "../errors/MissingRequiredFieldError.js";
import NotFoundError from "../errors/NotFoundError.js";
import CastError from "../errors/CastError.js";
import ValidationError from "../errors/ValidationError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createReview = async (req, res) => {
    const userId = req.user._id;
    let {
        productId,
        rating,
        comment
    } = req.body;

    // service + repository
    if (!productId || !rating) {
        throw new MissingRequiredFieldError('Missing required fields');
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        throw new NotFoundError('Product');
    }

    // Verify user has purchased this product (at least one delivered order)
    const hasPurchased = await Order.exists({
        user: userId,
        "items.product": productId,
        status: { $in: ["delivered", "shipping"] }
    });
    if (!hasPurchased)
        throw new ForbiddenError('Bạn cần mua sản phẩm này trước khi đánh giá');

    if (!(
        typeof rating === "string" &&
        rating.trim() !== "" &&
        !isNaN(Number(rating.trim())))) {
        throw new CastError('Invalid rating');
    }
    rating = Number(rating);
    if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
    }

    // thrid party service 
    // try/catch: undo the action when an error occurs 
    const media1 = req.files.media1 && req.files.media1[0];
    const media2 = req.files.media2 && req.files.media2[0];

    const medias = [media1, media2].filter(media => media != undefined);
    const mediasUrl = await Promise.all(
        medias.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, {
                resource_type: "auto"
            })
            return {
                url: result.secure_url,
                type: item.mimetype.startsWith("image") ? "image" : "video"
            }
        })
    )

    let newReview = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment,
        media: mediasUrl
    })

    // Populate user for immediate frontend append
    newReview = await newReview.populate("user", "name avatar");

    ApiResponse.created(newReview).send(res);
}

export const updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const {
        rating,
        comment
    } = req.body;
    const userId = req.user._id; 

    if (!rating || !comment) throw new MissingRequiredFieldError('Missing required fields');
    const update = { comment };
    if (isNaN(Number(rating)) 
        || Number(rating) < 1 
    || Number(rating) > 5) throw new ValidationError('Invalid rating');
    update.rating = Number(rating);
    
    const review = await Review.findOneAndUpdate(
        {
            _id: reviewId,
            user: userId
        },
        { $set: update },
        { new: true, runValidators: true }
    );
    if (!review) throw new NotFoundError('Review');

    ApiResponse.success('Success', review).send(res);
}