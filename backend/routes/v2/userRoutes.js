import express from 'express'
import { protect } from '../../middleware/v2/auth.middleware.js'
import {
    addAddress,
    profile,
    updateProfile,
    updateAddress,
    deleteAddress,
    listFavorites,
    addFavorite,
    removeFavorite
} from '../../controllers/v2/user.controller.js'

const userRoutes = express.Router()

// profile
userRoutes.get('/profile', protect, profile)
userRoutes.put('/profile', protect, updateProfile)

userRoutes.get('/favorites', protect, listFavorites)
userRoutes.post('/favorites/:productId', protect, addFavorite)
userRoutes.delete('/favorites/:productId', protect, removeFavorite)

// addresses 
userRoutes.post('/addresses', protect, addAddress)
userRoutes.put('/addresses/:addressId', protect, updateAddress)
userRoutes.delete('/addresses/:addressId', protect, deleteAddress)

export default userRoutes
