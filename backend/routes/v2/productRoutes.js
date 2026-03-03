import express from 'express'
import { 
    createProduct, 
    deleteProduct, 
    productDetail, 
    products, 
    updateProduct,
    productsForAdminReq 
} from '../../controllers/v2/product.controller.js'
import { protect, adminOnly } from '../../middleware/v2/auth.middleware.js'
import upload from '../../middleware/multer.js'
import { productReviews, updateReview, deleteReview } from '../../controllers/v2/review.controller.js'

const productRoutes = express.Router()

productRoutes.get('/admin', protect, adminOnly, productsForAdminReq)
productRoutes.get('/', products)
productRoutes.get("/:productId", productDetail)

productRoutes.post('/', protect, adminOnly, upload.fields([
    { name: 'img1', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
    { name: 'img3', maxCount: 1 },
    { name: 'img4', maxCount: 1 },
]),createProduct)
productRoutes.put('/:productId', protect, adminOnly, updateProduct)
productRoutes.delete('/:productId', protect, adminOnly, deleteProduct)
productRoutes.get('/:productId/reviews', productReviews)
// TODO 
productRoutes.put('/:productId/reviews/:reviewId', protect, updateReview)
productRoutes.delete('/:productId/reviews/:reviewId', protect, adminOnly, deleteReview)

export default productRoutes