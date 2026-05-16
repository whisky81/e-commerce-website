import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Setting from "../models/Setting.js";
import NotFoundError from "../errors/NotFoundError.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";

export const products = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const {
        category, categories,
        brand, brands,
        minPrice, maxPrice,
        sort,
        search, q
    } = req.query;

    const searchTerm = (search || q || "").trim();
    const filter = {};

    if (categories) {
        const list = String(categories).split(",").filter(Boolean);
        if (list.length) filter.category = { $in: list };
    } else if (category) {
        filter.category = category;
    }

    if (brands) {
        const blist = String(brands).split(",").filter(Boolean);
        if (blist.length) filter.brand = { $in: blist };
    } else if (brand) {
        filter.brand = brand;
    }

    if (searchTerm) {
        filter.name = { $regex: searchTerm, $options: 'i' };
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price") sortOption = { price: 1 };
    if (sort === "-price") sortOption = { price: -1 };

    const [products, total, _categories, _brands, config] = await Promise.all([
        Product.find(filter)
            .select("_id name price images category brand stock soldCount discount saleStartAt saleEndAt")
            .sort(sortOption).skip(skip).limit(limit).lean({ virtuals: true }),
        Product.countDocuments(filter),
        Product.distinct("category").lean(),
        Product.distinct("brand").lean(),
        Setting.findOne({}),
    ]);

    const banners = config ? config.banners : [];
    const banner = banners.find(b => b.isActive);
    // for (const product of products) delete product.images;

    ApiResponse.paginated(products, {
        page,
        limit,
        total,
        optional: {
            filters: { categories: _categories.sort(), brands: _brands.sort() },
            banner: banner ? { name: banner.name, url: banner.url } : null,
        },
    }).send(res);
};

export const productDetail = async (req, res) => {
    const { productId } = req.params;

    // product service + repository
    const product = await Product
        .findById(productId)
        .select("-createdAt -updatedAt -__v")
        .lean({ virtuals: true });
    if (!product) throw new NotFoundError('Product not found');

    const reviews = await Review
        .find({ product: productId, isHidden: false })
        .populate({
            path: "user",
            match: {
                isActive: true
            },
            select: "name avatar",
        })
        .select("rating comment media createdAt")
        .lean();

    // add meta like
    // avg rating
    // delete product.images;

    ApiResponse.success('Success', {
        product,
        reviews: reviews.filter(review => review.user)
    }).send(res);
};

// ─── Bulk import từ Excel (JSON array) ───────────────────────────────────────
export const bulkImportProducts = async (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
        throw new AppError("No products provided", 400);
    }

    const results = { created: 0, skipped: 0, errors: [] };
    const validDocs = [];

    for (const p of products) {
        // Validate đủ required fields theo schema (đã bỏ qua images vì sẽ có fallback)
        if (!p.name || !p.description || !p.price || !p.category || !p.brand) {
            results.skipped++;
            results.errors.push({ name: p.name || "unknown", reason: "Missing required fields" });
            continue;
        }

        const price = Number(p.price);
        if (isNaN(price) || price <= 0) {
            results.skipped++;
            results.errors.push({ name: p.name, reason: "Invalid price" });
            continue;
        }

        // Normalize images — giữ publicId nếu có, fallback "imported"
        // Nếu không có ảnh, dùng ảnh mặc định vì schema bắt buộc phải có ảnh
        const placeholderImg = "https://placehold.co/600x400/EEF2FF/4F46E5?text=Chưa+có+ảnh";
        const rawImages = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : [placeholderImg]);
        const images = rawImages
            .filter(Boolean)
            .map(img =>
                typeof img === "object"
                    ? { url: img.url, publicId: img.publicId || "imported" }
                    : { url: img, publicId: "imported" }
            );

        if (images.length === 0) {
            results.skipped++;
            results.errors.push({ name: p.name, reason: "No valid images" });
            continue;
        }

        validDocs.push({
            name: String(p.name).trim(),
            description: String(p.description).trim(),
            price,
            images,
            category: String(p.category).trim(),
            brand: String(p.brand).trim(),
            note: String(p.note || "").trim(),
            specifications: Array.isArray(p.specifications) ? p.specifications : [],
            stock: Math.max(0, Number(p.stock) || 100),
            soldCount: 0,
            discount: Math.min(100, Math.max(0, Number(p.discount) || 0)),
        });
    }

    // Một round trip duy nhất thay vì N
    if (validDocs.length > 0) {
        const inserted = await Product.insertMany(validDocs, {
            ordered: false,   // tiếp tục insert dù có doc bị lỗi
            throwOnValidationError: false,
        });
        results.created = inserted.length;
    }

    ApiResponse.success(`Imported ${results.created} products`, results).send(res);
};