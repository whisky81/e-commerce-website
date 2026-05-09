import Review from "../../models/Review.js";
import AppError from "../../errors/AppError.js";
import mongoose from "mongoose";
import ValidationError from "../../errors/ValidationError.js";
import NotFoundError from "../../errors/NotFoundError.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const bulkDeleteReviews = async (req, res) => {
    const { bulk } = req.body;

    if (!bulk
        || !Array.isArray(bulk)
        || bulk.length === 0
    ) {
        throw new AppError(
            'Please provide an array of review ids',
            400,
            'BAD_REQUEST');
    }

    const validIds = bulk.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) throw new ValidationError('Invalid review ids');

    const reviewsToDel = await Review.find({
        _id: { $in: bulk }
    }).select("product").lean();

    if (reviewsToDel.length === 0) {
        throw new NotFoundError('No reviews found to delete');
    }

    const deleteResult = await Review.deleteMany({
        _id: { $in: bulk }
    });

    const uniqueProductIds = [
        ...new Set(reviewsToDel.map(r => r.product))
    ];

    new ApiResponse(true, 200, 'Reviews deleted successfully', null, {
        deletedCount: deleteResult.deletedCount,
        affectedProducts: uniqueProductIds.length
    }).send(res);
}