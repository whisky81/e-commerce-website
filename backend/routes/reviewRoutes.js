import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import upload from '../middleware/multer.js'
import { createReview, updateReview } from '../controllers/review.controller.js'
import catchAsync from "../middleware/catchAsync.js";

const reviewRoutes = express.Router()

reviewRoutes.use(protect);

reviewRoutes.post('/', upload.fields([
    { name: 'media1', maxCount: 1 },
    { name: 'media2', maxCount: 1 },
]), catchAsync(createReview))
reviewRoutes.patch('/:reviewId', catchAsync(updateReview));

export default reviewRoutes