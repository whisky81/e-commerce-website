import express from 'express'
import { protect } from '../../middleware/v2/auth.middleware.js'
import upload from '../../middleware/multer.js'
import { createReview } from '../../controllers/v2/review.controller.js'

const reviewRoutes = express.Router()

reviewRoutes.post('/', protect, upload.fields([
    { name: 'media1', maxCount: 1 },
    { name: 'media2', maxCount: 1 },
]), createReview)

export default reviewRoutes