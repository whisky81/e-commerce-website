import express from 'express'
import { protect } from '../../middleware/v2/auth.middleware.js'
import { addToCart, userCart, removeCartItem } from '../../controllers/v2/cart.controller.js'
const cartRoutes = express.Router()

cartRoutes.post('/', protect, addToCart)
cartRoutes.get('/', protect, userCart)
cartRoutes.delete('/:productId', protect, removeCartItem)

export default cartRoutes