import express from 'express'
import {
    productDetail,
    products,
    bulkImportProducts,
} from '../controllers/product.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import catchAsync from "../middleware/catchAsync.js";

const productRoutes = express.Router()

productRoutes.get('/', catchAsync(products));
productRoutes.get("/:productId", catchAsync(productDetail));
productRoutes.post('/bulk-import', protect, adminOnly, catchAsync(bulkImportProducts))

export default productRoutes
