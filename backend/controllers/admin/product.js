import Product from "../../models/Product.js";
import Review from "../../models/Review.js";
import ApiResponse from "../../utils/ApiResponse.js";
import MissingRequiredFieldError from "../../errors/MissingRequiredFieldError.js";
import ValidationError from "../../errors/ValidationError.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import NotFoundError from "../../errors/NotFoundError.js";
import {delImage} from "../../config/cloudinary.js";

export const getProductDetailAdmin = async (req, res) => {
    const { productId } = req.params;

    // product service + repository
    const product = await Product
        .findById(productId)
        .lean({ virtuals: true });
    if (!product) throw new NotFoundError('Product');

    const reviews = await Review
        .find({ product: productId })
        .populate("user", "name avatar email")
        .select("rating comment media createdAt isHidden")
        .lean();


    new ApiResponse(true, 200, 'Success', {
        product, reviews
    }, {
        totalReviews: reviews.length,
        hiddenReviews: reviews.filter(r => r.isHidden).length
    }).send(res)
};

export const createProduct = async (req, res) => {
    let {
        name,
        description,
        price,
        category,
        brand,
        note,
        specifications,
        stock,
        discount,
        saleStartAt,
        saleEndAt } = req.body;
    specifications = typeof specifications === "string" ? JSON.parse(specifications) : [];

    if (!name || !description
        || !price || !category
        || !brand || !stock) {
        throw new MissingRequiredFieldError('Missing required fields');
    }
    if (isNaN(Number(price)) || isNaN(Number(stock))) {
        throw new ValidationError('Invalid price or stock');
    }

    const img1 = req.files?.img1?.[0];
    const img2 = req.files?.img2?.[0];
    const img3 = req.files?.img3?.[0];
    const img4 = req.files?.img4?.[0];
    const images = [img1, img2, img3, img4].filter(Boolean);

    const imagesUrl = await Promise.all(images.map(async item => {
        const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
        return {url: result.secure_url, publicId: result.public_id};
    }));

    const stockNum = stock !== undefined && stock !== "" ? Number(stock) : 100;
    const discountNum = discount != undefined ? Math.min(100, Math.max(0, Number(discount))) : 0;

    const product = await Product.create({
        name, description,
        price: Number(price),
        images: imagesUrl,
        category, brand, note, specifications,
        stock: Number.isFinite(stockNum) ? Math.max(0, stockNum) : 100,
        soldCount: 0,
        discount: discountNum,
        saleStartAt: saleStartAt || null,
        saleEndAt: saleEndAt || null,
    });

    ApiResponse.created({ _id: product._id }, 'Product created').send(res);
};

export const bulkDeleteProducts = async (req, res) => {
    const { bulk = [] } = req.body;

    if (!bulk
        || !Array.isArray(bulk)
        || bulk.length === 0
    ) {
        throw new AppError(
            'Please provide an array of product ids',
            400,
            'BAD_REQUEST');
    }

    const validIds = bulk.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) throw new ValidationError('Invalid product ids');

    const productsToDel = await Product.find({
        _id: { $in: bulk }
    }).select("name images").lean();

    if (productsToDel.length === 0) throw new NotFoundError("No products found to delete");

    const deleteResult = await Product.deleteMany({
        _id: { $in: bulk }
    });

    // bulk delete reviews
    // bulk delete images 
    const publicIds = [];
    for (const product of productsToDel) {
        for (const image of product.images) {
            if (image?.publicId) publicIds.push(image.publicId);
        }
    }
    const deletedImageResults = await Promise.all(publicIds.map(delImage));
    
    new ApiResponse(true, 200, 'Products deleted successfully', null, {
        deletedProductCount: deleteResult.deletedCount,
        deletedImageCount: deletedImageResults.reduce((acc, cur)=>acc + cur, 0),
        deletedReviewCount: 0 
    }).send(res);

};

export const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product not found");

    const fields = [
        "name", "description", "price", 
        "category", "brand", "specifications", 
        "note", "stock", "discount", 
        "saleStartAt", "saleEndAt"
    ];

    if (req.body?.specifications !== undefined) {
        let specs = req.body.specifications;
        if (typeof specs === "string") { 
            try { 
                specs = JSON.parse(specs); 
                product.specifications = specs;
            } catch { } 
        }
    }

    fields.forEach(field => {
        if (field === "specifications") return;
        if (req.body[field] !== undefined) {
            if (["price", "stock"].includes(field)) {
                product[field] = Math.max(0, Number(req.body[field]));
            } else if (field === "discount") {
                product.discount = Math.min(100, Math.max(0, Number(req.body[field])));
            } else if (["saleStartAt", "saleEndAt"].includes(field)) {
                product[field] = req.body[field] ? new Date(req.body[field]) : null;
            } else {
                product[field] = req.body[field];
            }
        }
    });

    await product.save();
    ApiResponse.success("Product updated", product).send(res);
};
