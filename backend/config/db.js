import mongoose from "mongoose";
const connectDB = async () => {
    const dbName = process.env.DB_NAME;
    const mongodbUri = dbName === "v3" ? process.env.V3_MONGODB_URI : process.env.MONGODB_URI;
    mongoose.connection.on('connected', () => {
        console.log(`DB connected\nDB NAME: ${dbName || "v2"}`);
    });
    await mongoose.connect(mongodbUri);
}

export default connectDB