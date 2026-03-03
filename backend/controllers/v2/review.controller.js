import Product from "../../models/v2/Product.js";
import Review from "../../models/v2/Review.js";
import { v2 as cloudinary } from "cloudinary"

export const createReview = async (req, res) => {
    try {
        const userId = req.user._id;
        let {
            productId,
            rating,
            comment
        } = req.body;
        if (!productId || !rating) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            })
        }

        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }

        if (!(
            typeof rating === "string" &&
            rating.trim() !== "" &&
            !isNaN(Number(rating.trim())))) {
            return res.status(400).json({
                success: false,
                message: "Invalid rating"
            })
        }
        rating = Number(rating);
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            })
        }

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

        await Review.create({
            user: userId,
            product: productId,
            rating,
            comment,
            media: mediasUrl
        })

        return res.status(201).json({
            success: true,
            message: "Review created",
        })


    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You already reviewed this product"
            });
        }
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

export const productReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({
            product: productId,
            isHidden: false
        })
            .populate("user", "name")
            .select("rating comment media createdAt");
        // console.log(reviews)

        return res.status(200).json({
            success: true,
            data: reviews.map(r => ({
                _id: r._id,
                rating: r.rating,
                comment: r.comment,
                media: r.media,
                user: r.user.name,
                createdAt: r.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

export const updateReview = async (req, res) => {

}

export const deleteReview = async (req, res) => {

}
