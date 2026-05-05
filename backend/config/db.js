import mongoose from "mongoose";
import Product from "../models/Product.js"

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log("DB connected")
    })

    await mongoose.connect(`${process.env.MONGODB_URI}`)
    await Product.updateMany(
        { stock: { $exists: false } },
        { $set: { stock: 10000, soldCount: 0 } }
    )
}

export default connectDB