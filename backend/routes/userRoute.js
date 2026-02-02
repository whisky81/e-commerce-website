import express from 'express'
import { login, register, adminLogin } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.post('/admin', adminLogin)

export default userRouter