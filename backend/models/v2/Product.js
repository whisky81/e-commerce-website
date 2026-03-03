import mongoose from "mongoose";

const specificationSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: String,
            required: true,
            trim: true
        }
    },
    { _id: false } // không cần _id cho từng specification
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        images: [
            {
                type: String,
                required: true
            }
        ],

        category: {
            type: String,
            required: true,
            index: true
        },
 
        brand: {
            type: String,
            required: true,
            index: true
        },

        specifications: [specificationSchema],

        note: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true, // tự tạo createdAt & updatedAt
        minimize: false
    }
);


const Product =
    mongoose.models.Product || mongoose.model("Product", productSchema);


export default Product;