import express from 'express'
import { protect } from '../../middleware/v2/auth.middleware.js'
import {
    addAddress,
    profile,
    updateProfile,
    updateAddress,
    deleteAddress
} from '../../controllers/v2/user.controller.js'

const userRoutes = express.Router()

// profile
userRoutes.get('/profile', protect, profile)
userRoutes.put('/profile', protect, updateProfile)

// addresses 
userRoutes.post('/addresses', protect, addAddress)
userRoutes.put('/addresses/:addressId', protect, updateAddress)
userRoutes.delete('/addresses/:addressId', protect, deleteAddress)

export default userRoutes
