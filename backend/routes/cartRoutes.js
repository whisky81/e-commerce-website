import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { addToCart, userCart, removeCartItem } from '../controllers/cart.controller.js'
const cartRoutes = express.Router()

cartRoutes.post('/', protect, addToCart)
cartRoutes.get('/', protect, userCart)
cartRoutes.delete('/:productId', protect, removeCartItem)

export default cartRoutes