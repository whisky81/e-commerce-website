import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { addToCart, userCart, removeCartItem } from '../controllers/cart.controller.js'
import catchAsync from "../middleware/catchAsync.js";
const cartRoutes = express.Router()

cartRoutes.use(protect);

cartRoutes.post('/', catchAsync(addToCart))
cartRoutes.get('/', catchAsync(userCart))
cartRoutes.delete('/:productId', catchAsync(removeCartItem))

export default cartRoutes