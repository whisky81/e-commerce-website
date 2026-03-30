import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import connectCloudinary from './config/cloudinary.js'
import authRoutes from './routes/v2/authRoutes.js'
import userRoutes from './routes/v2/userRoutes.js'
import productRoutes from './routes/v2/productRoutes.js'
import cartRoutes from './routes/v2/cartRoutes.js'
import reviewRoutes from './routes/v2/reviewRoutes.js'
import orderRoutes from './routes/v2/orderRoutes.js'
import adminRoutes from './routes/v2/adminRoutes.js'
import settingRoutes from './routes/v2/settingRoutes.js'   

// app config
const app = express()
const port = process.env.PORT || 5000
connectDB()
connectCloudinary()

// middleware
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use(cookieParser())

// api endpoints 
app.use('/api/v2/auth', authRoutes)
app.use('/api/v2/users', userRoutes)
app.use('/api/v2/products', productRoutes)
app.use('/api/v2/cart', cartRoutes)
app.use('/api/v2/reviews', reviewRoutes)
app.use('/api/v2/orders', orderRoutes)
app.use('/api/v2/admin', adminRoutes)
app.use('/api/v2/setting', settingRoutes)

app.listen(port, () => {
    console.log(`Local: http://localhost:${port}`)
})