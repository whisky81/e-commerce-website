import mongoose from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const specificationSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        _id: false
    }
);

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        images: {
            type: [
                {
                    url: {
                        type: String,
                        required: true
                    },

                    publicId: {
                        type: String,
                        required: true
                    }
                }
            ],

            validate: {
                validator: function (images) {
                    return images && images.length > 0;
                },

                message: "Product must have at least one image"
            }
        },
        category: { type: String, required: true, index: true },
        brand: { type: String, required: true, index: true },
        specifications: [specificationSchema],
        note: { type: String, default: "" },
        stock: { type: Number, required: true, default: 100, min: 0 },
        soldCount: { type: Number, default: 0, min: 0 },

        discount: { type: Number, default: 0, min: 0, max: 100 },

        saleStartAt: { type: Date, default: null },
        saleEndAt: { type: Date, default: null },
    },
    { timestamps: true, minimize: false }
);

productSchema.virtual("salePrice").get(function () {
    const now = new Date();
    const inSalePeriod =
        (!this.saleStartAt || this.saleStartAt <= now) &&
        (!this.saleEndAt || this.saleEndAt >= now);

    if (this.discount > 0 && inSalePeriod) {
        return Math.round(this.price * (1 - this.discount / 100));
    }
    return this.price;
});

// productSchema.virtual("imageUrls").get(function() {
//     return this.images.map(o=>o?.url);
// });

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });
productSchema.plugin(mongooseLeanVirtuals);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
