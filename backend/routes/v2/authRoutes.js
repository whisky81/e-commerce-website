import express from 'express'
import { 
    register, 
    login,
    logout
} from '../../controllers/v2/auth.controller.js'
import { protect } from '../../middleware/v2/auth.middleware.js'

const authRoutes = express.Router()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.post('/logout', protect, logout)

export default authRoutes
