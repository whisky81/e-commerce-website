import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true }
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            trim: true,
            default: ""
        },

        media: [mediaSchema],

        isHidden: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review =
    mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;