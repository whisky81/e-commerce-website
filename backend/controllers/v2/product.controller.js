import Product from "../../models/v2/Product.js";
import { v2 as cloudinary } from "cloudinary";
import Review from "../../models/v2/Review.js";
import Setting from "../../models/v2/Setting.js";
import AppError from "../../errors/AppError.js";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Trả về effective price (đã trừ discount nếu còn trong thời gian sale) */
const getEffectivePrice = (product) => {
    const now = new Date();
    const inSale =
        product.discount > 0 &&
        (!product.saleStartAt || product.saleStartAt <= now) &&
        (!product.saleEndAt || product.saleEndAt >= now);
    return inSale ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
};

// ─── Admin list ──────────────────────────────────────────────────────────────

export const productsForAdminReq = async (req, res) => {
    try {
        const products = await Product
            .find({})
            .select("_id name price images category brand stock soldCount discount saleStartAt saleEndAt createdAt")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Public list ─────────────────────────────────────────────────────────────

export const products = async (req, res) => {
    // throw new AppError('this is test', 400, 'TEST');
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const { category, categories, brand, brands, minPrice, maxPrice, sort, search, q } = req.query;
    const searchTerm = (search || q || "").trim();
    const filter = {};

    if (categories) {
        const list = String(categories).split(",").map(c => c.trim()).filter(Boolean);
        if (list.length) filter.category = { $in: list };
    } else if (category) {
        filter.category = category;
    }

    if (brands) {
        const blist = String(brands).split(",").map(b => b.trim()).filter(Boolean);
        if (blist.length) filter.brand = { $in: blist };
    } else if (brand) {
        filter.brand = brand;
    }

    if (searchTerm) filter.name = { $regex: searchTerm, $options: "i" };

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price") sortOption = { price: 1 };
    if (sort === "-price") sortOption = { price: -1 };

    const [rawProducts, total, _categories, _brands, config] = await Promise.all([
        Product.find(filter)
            .select("_id name price images category brand stock soldCount discount saleStartAt saleEndAt")
            .sort(sortOption).skip(skip).limit(limit),
        Product.countDocuments(filter),
        Product.distinct("category"),
        Product.distinct("brand"),
        Setting.findOne({}),
    ]);

    // Gắn salePrice cho từng sản phẩm
    const data = rawProducts.map(p => {
        const obj = p.toObject({ virtuals: true });
        obj.salePrice = getEffectivePrice(p);
        return obj;
    });

    const banners = config ? config.banners : [];
    const banner = banners.find(b => b.isActive);

    res.status(200).json({
        success: true, page, limit, total,
        totalPages: Math.ceil(total / limit),
        data,
        filters: { categories: _categories.sort(), brands: _brands.sort() },
        banner: banner ? { name: banner.name, url: banner.url } : null,
    });
};

// ─── Product detail ──────────────────────────────────────────────────────────

export const productDetail = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const reviews = await Review.find({ product: productId, isHidden: false })
            .populate("user", "name")
            .select("rating comment media createdAt");

        const productObj = product.toObject({ virtuals: true });
        productObj.salePrice = getEffectivePrice(product);

        res.status(200).json({
            success: true,
            data: {
                product: productObj,
                reviews: reviews.map(r => ({
                    _id: r._id, rating: r.rating, comment: r.comment,
                    media: r.media, user: r.user.name, createdAt: r.createdAt,
                })),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── Create ──────────────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
    try {
        let { name, description, price, category, brand, note, specifications, stock, discount, saleStartAt, saleEndAt } = req.body;
        specifications = typeof specifications === "string" ? JSON.parse(specifications) : (specifications || []);

        if (!name || !price || !category || !brand) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const img1 = req.files?.img1?.[0];
        const img2 = req.files?.img2?.[0];
        const img3 = req.files?.img3?.[0];
        const img4 = req.files?.img4?.[0];
        const images = [img1, img2, img3, img4].filter(Boolean);

        const imagesUrl = await Promise.all(images.map(async item => {
            const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
            return result.secure_url;
        }));

        const stockNum = stock !== undefined && stock !== "" ? Number(stock) : 10000;
        const discountNum = discount !== undefined ? Math.min(100, Math.max(0, Number(discount))) : 0;

        const product = await Product.create({
            name, description,
            price: Number(price),
            images: imagesUrl,
            category, brand, note, specifications,
            stock: Number.isFinite(stockNum) ? Math.max(0, stockNum) : 10000,
            soldCount: 0,
            discount: discountNum,
            saleStartAt: saleStartAt || null,
            saleEndAt: saleEndAt || null,
        });

        res.status(201).json({ success: true, message: "Product created", data: { _id: product._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const fields = ["name", "description", "price", "category", "brand", "specifications", "note", "stock", "discount", "saleStartAt", "saleEndAt"];

        if (req.body.specifications !== undefined) {
            let specs = req.body.specifications;
            if (typeof specs === "string") { try { specs = JSON.parse(specs); } catch { } }
            product.specifications = specs;
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
        return res.status(200).json({ success: true, message: "Product updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        await product.deleteOne();
        return res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── Bulk import từ Excel (JSON array) ───────────────────────────────────────

export const bulkImportProducts = async (req, res) => {
    try {
        const { products } = req.body; // Array of product objects
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "No products provided" });
        }

        const results = { created: 0, skipped: 0, errors: [] };

        for (const p of products) {
            try {
                if (!p.name || !p.price || !p.category || !p.brand) {
                    results.skipped++;
                    results.errors.push({ name: p.name || "unknown", reason: "Missing required fields" });
                    continue;
                }
                await Product.create({
                    name: String(p.name).trim(),
                    description: String(p.description || "").trim(),
                    price: Math.max(0, Number(p.price) || 0),
                    images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
                    category: String(p.category).trim(),
                    brand: String(p.brand).trim(),
                    note: String(p.note || "").trim(),
                    specifications: Array.isArray(p.specifications) ? p.specifications : [],
                    stock: Math.max(0, Number(p.stock) || 10000),
                    soldCount: 0,
                    discount: Math.min(100, Math.max(0, Number(p.discount) || 0)),
                });
                results.created++;
            } catch (err) {
                results.skipped++;
                results.errors.push({ name: p.name, reason: err.message });
            }
        }

        res.status(200).json({ success: true, message: `Đã nhập ${results.created} sản phẩm`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
