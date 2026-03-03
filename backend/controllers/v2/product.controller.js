import Product from "../../models/v2/Product.js";
import { v2 as cloudinary } from "cloudinary"
import Review from "../../models/v2/Review.js";

export const productsForAdminReq = async (req, res) => {
    try {
        const products = await Product
            .find({})
            .select("_id name price images category brand createdAt")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const products = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const { category, minPrice, maxPrice, sort } = req.query;

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 }; // mặc định mới nhất
        if (sort === "price") sortOption = { price: 1 };
        if (sort === "-price") sortOption = { price: -1 };

        const products = await Product.find(filter)
            .select("_id name price images category brand") // giảm payload 
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        const categories = await Product.distinct('category');
        const brands = await Product.distinct('brand');

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: products,
            filters: {
                categories: categories.sort(),
                brands: brands.sort()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

export const productDetail = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const reviews = await Review.find({
            product: productId,
            isHidden: false
        })
            .populate("user", "name")
            .select("rating comment media createdAt");

        res.status(200).json({
            success: true,
            data: {
                product, reviews: reviews.map(r => ({
                    _id: r._id,
                    rating: r.rating,
                    comment: r.comment,
                    media: r.media,
                    user: r.user.name,
                    createdAt: r.createdAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const createProduct = async (req, res) => {
    try {
        let {
            name,
            description,
            price,
            category,
            brand,
            note,
            specifications
        } = req.body;
        specifications = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
        if (!name || !price || !category || !brand) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            })
        }

        const img1 = req.files.img1 && req.files.img1[0];
        const img2 = req.files.img2 && req.files.img2[0];
        const img3 = req.files.img3 && req.files.img3[0];
        const img4 = req.files.img4 && req.files.img4[0];

        const images = [img1, img2, img3, img4].filter(img => img != undefined);
        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, {
                    resource_type: 'image'
                })
                return result.secure_url;
            })
        )

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            images: imagesUrl,
            category,
            brand,
            note,
            specifications
        })

        res.status(201).json({
            success: true,
            message: "Product created",
            data: {
                _id: product._id
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const fields = [
            "name",
            "description",
            "price",
            "category",
            "brand",
            "specifications",
            "note"
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                product[field] = req.body[field];
            }
        });

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Product deleted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}