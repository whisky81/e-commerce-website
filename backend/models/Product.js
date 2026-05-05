import mongoose from "mongoose";

const specificationSchema = new mongoose.Schema(
    { key: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name:          { type: String, required: true, trim: true },
        description:   { type: String, required: true },
        price:         { type: Number, required: true, min: 0 },
        images:        [{ type: String, required: true }],
        category:      { type: String, required: true, index: true },
        brand:         { type: String, required: true, index: true },
        specifications: [specificationSchema],
        note:          { type: String, default: "" },
        stock:         { type: Number, required: true, default: 10000, min: 0 },
        soldCount:     { type: Number, default: 0, min: 0 },

        // ✅ DISCOUNT: % giảm giá (0 = không giảm, 50 = giảm 50%)
        discount:      { type: Number, default: 0, min: 0, max: 100 },

        // ✅ Thời gian sale tự động
        saleStartAt:   { type: Date, default: null },
        saleEndAt:     { type: Date, default: null },
    },
    { timestamps: true, minimize: false }
);

// ✅ Virtual: tính giá sau giảm (salePrice)
productSchema.virtual("salePrice").get(function () {
    const now = new Date();
    const inSalePeriod =
        (!this.saleStartAt || this.saleStartAt <= now) &&
        (!this.saleEndAt   || this.saleEndAt   >= now);

    if (this.discount > 0 && inSalePeriod) {
        return Math.round(this.price * (1 - this.discount / 100));
    }
    return this.price;
});

// ✅ Đảm bảo virtual fields xuất hiện trong toJSON/toObject
productSchema.set("toJSON",   { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
