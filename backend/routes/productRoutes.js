import express from 'express'
import {
    createProduct,
    deleteProduct,
    productDetail,
    products,
    updateProduct,
    productsForAdminReq,
    bulkImportProducts,
} from '../controllers/product.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import upload from '../middleware/multer.js'
import { productReviews, updateReview, deleteReview } from '../controllers/review.controller.js'
import catchAsync from "../middleware/catchAsync.js";

const productRoutes = express.Router()

productRoutes.get('/admin', protect, adminOnly, productsForAdminReq)
productRoutes.get('/', catchAsync(products))
productRoutes.get("/:productId", productDetail)

productRoutes.post('/', protect, adminOnly, upload.fields([
    { name: 'img1', maxCount: 1 }, { name: 'img2', maxCount: 1 },
    { name: 'img3', maxCount: 1 }, { name: 'img4', maxCount: 1 },
]), createProduct)

productRoutes.post('/bulk-import', protect, adminOnly, bulkImportProducts)

productRoutes.put('/:productId', protect, adminOnly, updateProduct)
productRoutes.delete('/:productId', protect, adminOnly, deleteProduct)
productRoutes.get('/:productId/reviews', productReviews)
productRoutes.put('/:productId/reviews/:reviewId', protect, updateReview)
productRoutes.delete('/:productId/reviews/:reviewId', protect, adminOnly, deleteReview)

export default productRoutes
