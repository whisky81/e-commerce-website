# 🏗️ Refactoring Roadmap — MERN Backend v2
### Electronics E-commerce | Design Patterns Implementation Guide

> **Mục tiêu:** Biến Fat Controller monolith thành Clean Architecture  
> có thể **clone, tái sử dụng** cho bất kỳ MERN project nào khác.

---

## 📍 Trạng thái hiện tại vs Mục tiêu

```
HIỆN TẠI (Anti-patterns)          MỤC TIÊU (Clean Architecture)
──────────────────────────         ──────────────────────────────
Fat Controllers                    Thin Controllers + Service Layer
Logic thanh toán if/else           Strategy + Adapter Pattern
Mongoose gọi thẳng ở Controller    Repository Pattern
try/catch lặp lại khắp nơi        Centralized Error Handling
console.log                        Structured Winston Logger
Không có event system              Observer / EventEmitter
Tạo object phân tán                Factory + Builder Pattern
```

---

## 🗺️ Kiến trúc Mục tiêu

```
Request
  ↓
[ Route ]
  ↓
[ Middleware Chain ]          ← Chain of Responsibility
  ├── requestLogger
  ├── authenticate (JWT/OAuth) ← Strategy Pattern
  ├── authorize (adminOnly)    ← Proxy Pattern
  └── validateRequest          ← Chain of Responsibility
  ↓
[ Controller ]               ← Thin: chỉ parse req / trả res
  ↓
[ Facade ]                   ← Orchestrate complex flows (Order, Auth)
  ↓
[ Service ]                  ← Business Logic
  ↓
[ Repository ]               ← Data Access (wraps Mongoose)
  ↓
[ Adapter ]                  ← Third-party (Stripe, VNPay, Momo, Cloudinary)
  ↓
[ MongoDB ]
  ↑
[ EventEmitter ]             ← Observer: emit sau mỗi business event
  ├── on(ORDER_PLACED)   → trừ stock, clear cart, gửi email
  ├── on(USER_REGISTERED) → gửi verify email, tạo cart
  └── on(ORDER_CANCELLED) → hoàn stock, gửi email
```

---

## 📁 Cấu trúc Thư mục Mục tiêu

```
backend/
├── v2.js                          # Entry point (giữ gọn)
├── config/
│   ├── database.js                # Singleton — DB connection
│   ├── redis.js                   # Singleton — Redis cache
│   ├── cloudinary.js              # Singleton — Cloudinary
│   ├── logger.js                  # Singleton — Winston logger
│   └── passport.js                # OAuth strategies
│
├── errors/
│   ├── AppError.js                # Base custom error
│   ├── NotFoundError.js
│   ├── ValidationError.js
│   ├── UnauthorizedError.js
│   └── ForbiddenError.js
│
├── middleware/
│   ├── requestLogger.js           # Log mọi request (requestId)
│   ├── errorHandler.js            # Global error handler
│   ├── catchAsync.js              # Decorator: bọc async handlers
│   ├── authenticate.js            # Strategy Pattern: JWT / OAuth
│   ├── authorize.js               # Proxy Pattern: role check
│   └── validateRequest.js         # Chain of Responsibility: validation
│
├── events/
│   ├── AppEventEmitter.js         # Singleton EventEmitter
│   ├── eventNames.js              # Centralized event name constants
│   └── listeners/
│       ├── userListeners.js       # Observer: user events
│       ├── orderListeners.js      # Observer: order events
│       └── index.js               # Register tất cả listeners
│
├── repositories/
│   ├── BaseRepository.js          # Generic CRUD
│   ├── UserRepository.js
│   ├── ProductRepository.js
│   ├── OrderRepository.js
│   ├── ReviewRepository.js
│   └── SubscriberRepository.js
│
├── adapters/
│   ├── payment/
│   │   ├── IPaymentAdapter.js     # Interface chuẩn
│   │   ├── StripeAdapter.js
│   │   ├── VNPayAdapter.js
│   │   ├── MomoAdapter.js
│   │   └── PaymentAdapterFactory.js
│   ├── storage/
│   │   ├── IStorageAdapter.js
│   │   ├── CloudinaryAdapter.js
│   │   └── LocalStorageAdapter.js
│   └── email/
│       ├── IEmailAdapter.js
│       └── NodemailerAdapter.js
│
├── services/
│   ├── authService.js
│   ├── userService.js
│   ├── productService.js
│   ├── orderService.js
│   ├── cartService.js
│   ├── reviewService.js
│   ├── marketingService.js
│   └── settingService.js
│
├── facades/
│   ├── AuthFacade.js              # register, login, verify, oauth
│   ├── OrderFacade.js             # placeOrder, cancel, verify payment
│   └── MarketingFacade.js         # bulk discount, send promo
│
├── controllers/v2/
│   ├── auth.controller.js         # Thin: gọi AuthFacade
│   ├── user.controller.js
│   ├── product.controller.js
│   ├── order.controller.js        # Thin: gọi OrderFacade
│   ├── cart.controller.js
│   ├── review.controller.js
│   ├── marketing.controller.js
│   └── setting.controller.js
│
├── utils/
│   ├── ApiResponse.js             # Factory: chuẩn hoá response
│   ├── QueryBuilder.js            # Builder: Mongoose query
│   ├── EmailBuilder.js            # Builder: email object
│   └── tokenUtils.js
│
└── routes/v2/                     # Giữ nguyên structure
```

---

## 🚀 Lộ trình Refactor — 5 Giai đoạn

> **Nguyên tắc Strangler Fig:** Không rewrite toàn bộ.  
> Từng bước thay thế từng phần — app luôn chạy được.

---

## PHASE 1 — Foundation (Core Infrastructure)
> **Mục tiêu:** Tạo nền móng — mọi phase sau đều dùng.  
> **Thời gian ước tính:** 1-2 ngày

### 1.1 Custom Error Classes

```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### 1.2 Singleton Logger (Winston)

```javascript
// config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

class Logger {
  constructor() {
    if (Logger._instance) return Logger._instance;
    this._logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'electronics-backend', env: process.env.NODE_ENV },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          level: 'error', maxFiles: '30d'
        }),
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          maxFiles: '14d'
        }),
      ],
    });
    Logger._instance = this;
  }
  info(msg, meta = {})  { this._logger.info(msg, meta); }
  error(msg, meta = {}) { this._logger.error(msg, meta); }
  warn(msg, meta = {})  { this._logger.warn(msg, meta); }
  debug(msg, meta = {}) { this._logger.debug(msg, meta); }
  logError(err, meta = {}) {
    this._logger.error(err.message, {
      ...meta, stack: err.stack,
      errorCode: err.errorCode
    });
  }
}

export default new Logger();
```

### 1.3 catchAsync + Global Error Handler

```javascript
// middleware/catchAsync.js
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    logger.warn('Operational error', {
      requestId: req.requestId, errorCode: err.errorCode,
      path: req.path, userId: req.user?.id
    });
  } else {
    logger.logError(err, { requestId: req.requestId, path: req.path });
  }

  // Mongoose errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, errorCode: 'DUPLICATE_KEY', message: `${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, errorCode: 'INVALID_ID', message: 'Invalid ID format' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, errorCode: 'INVALID_TOKEN', message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, errorCode: 'TOKEN_EXPIRED', message: 'Token expired' });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false, errorCode: err.errorCode, message: err.message
    });
  }
  return res.status(500).json({
    success: false, errorCode: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};
```

### 1.4 ApiResponse Factory

```javascript
// utils/ApiResponse.js
class ApiResponse {
  constructor(success, statusCode, message, data, meta) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }
  static success(data, message = 'Success') {
    return new ApiResponse(true, 200, message, data, null);
  }
  static created(data, message = 'Created successfully') {
    return new ApiResponse(true, 201, message, data, null);
  }
  static paginated(data, { page, limit, total }) {
    const meta = {
      page: Number(page), limit: Number(limit), total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
    };
    return new ApiResponse(true, 200, 'Success', data, meta);
  }
  send(res) { return res.status(this.statusCode).json(this); }
}
```

### 1.5 Request Logger Middleware

```javascript
// middleware/requestLogger.js
import { v4 as uuidv4 } from 'uuid';

const requestLogger = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  req.startTime = Date.now();
  res.setHeader('x-request-id', req.requestId);

  logger.info('Incoming request', {
    requestId: req.requestId, method: req.method,
    path: req.path, ip: req.ip,
  });

  // Dùng res.on('finish') — bắt MỌI loại response
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('Request completed', {
      requestId: req.requestId, statusCode: res.statusCode,
      duration: `${duration}ms`, path: req.path,
    });
    if (duration > 1000) {
      logger.warn('Slow request', { path: req.path, duration: `${duration}ms` });
    }
  });
  next();
};
```

---

## PHASE 2 — Repository Layer
> **Mục tiêu:** Tách Mongoose ra khỏi Controllers/Services.  
> **Thời gian ước tính:** 1-2 ngày

### 2.1 BaseRepository (Generic)

```javascript
// repositories/BaseRepository.js
class BaseRepository {
  constructor(model) { this._model = model; }

  async findAll(filter = {}, options = {}) {
    const { select = '', populate = [], sort = { createdAt: -1 }, lean = true } = options;
    let q = this._model.find(filter).sort(sort).select(select);
    populate.forEach(p => { q = q.populate(p); });
    return lean ? q.lean().exec() : q.exec();
  }

  async findById(id, options = {}) {
    const { select = '', populate = [] } = options;
    let q = this._model.findById(id).select(select);
    populate.forEach(p => { q = q.populate(p); });
    return q.lean().exec();
  }

  async findOne(filter, options = {}) {
    return this._model.findOne(filter).select(options.select || '').lean();
  }

  async create(data) { return this._model.create(data); }

  async updateById(id, data) {
    return this._model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async deleteById(id) { return this._model.findByIdAndDelete(id); }
  async count(filter = {}) { return this._model.countDocuments(filter); }
  async exists(filter) { return this._model.exists(filter); }

  async paginate(filter = {}, page = 1, limit = 10, options = {}) {
    const skip = (page - 1) * limit;
    const { sort = { createdAt: -1 }, select = '', populate = [] } = options;
    let q = this._model.find(filter).sort(sort).skip(skip).limit(limit).select(select);
    populate.forEach(p => { q = q.populate(p); });
    const [data, total] = await Promise.all([q.lean().exec(), this._model.countDocuments(filter)]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
```

### 2.2 ProductRepository (Đặc thù cho electronics)

```javascript
// repositories/ProductRepository.js
class ProductRepository extends BaseRepository {
  constructor() { super(Product); }

  async findWithSalePrice(filter = {}) {
    // Lấy products và tính salePrice virtual
    return this._model.find(filter).lean({ virtuals: true });
  }

  async searchProducts({ term, category, brand, minPrice, maxPrice, page, limit }) {
    const filter = {};
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (brand)    filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    return this.paginate(filter, page, limit, { lean: true });
  }

  async findOnSale() {
    const now = new Date();
    return this._model.find({
      discount: { $gt: 0 },
      saleStartAt: { $lte: now },
      saleEndAt: { $gte: now },
    }).lean({ virtuals: true });
  }

  async decrementStock(items) {
    // Bulk update stock
    const ops = items.map(({ product, quantity }) => ({
      updateOne: {
        filter: { _id: product, stock: { $gte: quantity } },
        update: { $inc: { stock: -quantity, soldCount: quantity } },
      },
    }));
    return this._model.bulkWrite(ops);
  }

  async bulkSetDiscount(productIds, discount, saleStartAt, saleEndAt) {
    return this._model.updateMany(
      { _id: { $in: productIds } },
      { $set: { discount, saleStartAt, saleEndAt } }
    );
  }
}

export default new ProductRepository();
```

### 2.3 QueryBuilder (Builder Pattern cho Product filter)

> **Tại sao cần Builder ở đây?**  
> Product filter cho linh kiện điện tử có thể có 10+ tiêu chí cùng lúc:  
> category + brand + priceRange + specifications + onSale + inStock + search + sort + paginate  
> Nhét hết vào 1 function = constructor có 10 tham số = không ai nhớ thứ tự.  
> Builder giải quyết bằng cách build từng bước, đọc như văn xuôi.

```javascript
// utils/QueryBuilder.js
class QueryBuilder {
  constructor(model) {
    this._model    = model;
    this._query    = {};
    this._sort     = { createdAt: -1 };
    this._page     = 1;
    this._limit    = 10;
    this._maxLimit = 100;       // Hard cap — tránh client request limit=99999
    this._populate = [];
    this._select   = '';
    this._lean     = false;
    this._useVirtuals = false;  // Cho Mongoose virtual fields (vd: salePrice)
    this._pipeline = null;      // Nếu dùng aggregate thay vì find
  }

  // ─── FILTER METHODS ──────────────────────────────────────────

  where(conditions) {
    this._query = { ...this._query, ...conditions };
    return this;
  }

  // Tìm kiếm full-text trên nhiều fields
  search(fields, term) {
    if (term && term.trim()) {
      this._query.$or = fields.map(f => ({
        [f]: { $regex: term.trim(), $options: 'i' }
      }));
    }
    return this;
  }

  // Filter giá — tự handle cả price lẫn salePrice
  priceRange(min, max) {
    if (min || max) {
      this._query.price = {};
      if (min) this._query.price.$gte = Number(min);
      if (max) this._query.price.$lte = Number(max);
    }
    return this;
  }

  // Filter theo nhiều categories (array hoặc string)
  category(value) {
    if (!value) return this;
    this._query.category = Array.isArray(value)
      ? { $in: value }
      : value;
    return this;
  }

  // Filter theo nhiều brands
  brand(value) {
    if (!value) return this;
    this._query.brand = Array.isArray(value)
      ? { $in: value }
      : value;
    return this;
  }

  // ĐẶC THÙ cho linh kiện điện tử:
  // Filter theo specifications { key: 'RAM', value: '16GB' }
  // Product schema: specifications: [{ key, value }]
  spec(key, value) {
    if (!key || !value) return this;
    if (!this._query.$and) this._query.$and = [];
    this._query.$and.push({
      specifications: {
        $elemMatch: {
          key: { $regex: key, $options: 'i' },
          value: { $regex: value, $options: 'i' },
        }
      }
    });
    return this;
  }

  // Nhiều specs cùng lúc: { RAM: '16GB', Storage: '512GB' }
  specs(specsObj = {}) {
    Object.entries(specsObj).forEach(([key, value]) => {
      this.spec(key, value);
    });
    return this;
  }

  // Chỉ lấy sản phẩm đang giảm giá
  onSale() {
    const now = new Date();
    this._query.discount = { $gt: 0 };
    this._query.saleStartAt = { $lte: now };
    this._query.saleEndAt   = { $gte: now };
    return this;
  }

  // Chỉ lấy sản phẩm còn hàng
  inStock(minStock = 1) {
    this._query.stock = { $gte: minStock };
    return this;
  }

  // Filter theo khoảng thời gian tạo
  createdBetween(startDate, endDate) {
    if (!startDate && !endDate) return this;
    this._query.createdAt = {};
    if (startDate) this._query.createdAt.$gte = new Date(startDate);
    if (endDate)   this._query.createdAt.$lte = new Date(endDate);
    return this;
  }

  // Exclude các IDs (dùng cho recommendation: "tương tự nhưng không phải cái này")
  excludeIds(ids = []) {
    if (ids.length) this._query._id = { $nin: ids };
    return this;
  }

  // ─── SORT METHODS ────────────────────────────────────────────

  sortBy(field, order = 'desc') {
    const SORTABLE_FIELDS = ['price', 'createdAt', 'soldCount', 'discount', 'stock'];
    if (!SORTABLE_FIELDS.includes(field)) {
      field = 'createdAt'; // Fallback an toàn — tránh inject field lạ
    }
    this._sort = { [field]: order === 'asc' ? 1 : -1 };
    return this;
  }

  // Preset sorts hay dùng
  newestFirst()    { return this.sortBy('createdAt', 'desc'); }
  bestSelling()    { return this.sortBy('soldCount', 'desc'); }
  priceLowToHigh() { return this.sortBy('price', 'asc'); }
  priceHighToLow() { return this.sortBy('price', 'desc'); }
  mostDiscounted() { return this.sortBy('discount', 'desc'); }

  // ─── PAGINATION ───────────────────────────────────────────────

  paginate(page, limit) {
    this._page  = Math.max(1, Number(page)  || 1);
    this._limit = Math.min(this._maxLimit, Math.max(1, Number(limit) || 10));
    return this;
  }

  // ─── SHAPE METHODS ───────────────────────────────────────────

  populate(...fields) {
    this._populate.push(...fields.flat());
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  // .lean() → plain JS object, nhanh hơn ~30%
  // .lean(true) với virtuals → cần cho salePrice virtual field
  lean(withVirtuals = false) {
    this._lean = true;
    this._useVirtuals = withVirtuals;
    return this;
  }

  // ─── STATIC FACTORIES ─────────────────────────────────────────
  // Tạo QueryBuilder từ req.query — không cần parse thủ công ở controller

  static fromRequest(model, query = {}) {
    const {
      page, limit, search, category, brand,
      minPrice, maxPrice, sort, order,
      onSale, inStock, startDate, endDate,
      ...specs // Tất cả params còn lại coi là spec filter
                // VD: ?RAM=16GB&Storage=512GB
    } = query;

    const builder = new QueryBuilder(model)
      .paginate(page, limit)
      .search(['name', 'description', 'brand'], search)
      .category(category)
      .brand(brand)
      .priceRange(minPrice, maxPrice)
      .createdBetween(startDate, endDate)
      .lean(true); // Luôn lean khi từ HTTP request

    // Parse sort string: "price:asc", "soldCount:desc"
    if (sort) {
      const [field, dir] = sort.split(':');
      builder.sortBy(field, dir || 'desc');
    }

    if (onSale === 'true')  builder.onSale();
    if (inStock === 'true') builder.inStock();

    // Spec filters: ?RAM=16GB → spec('RAM', '16GB')
    const RESERVED_PARAMS = new Set([
      'page','limit','search','category','brand',
      'minPrice','maxPrice','sort','order',
      'onSale','inStock','startDate','endDate'
    ]);
    Object.entries(specs).forEach(([key, value]) => {
      if (!RESERVED_PARAMS.has(key) && value) {
        builder.spec(key, value);
      }
    });

    return builder;
  }

  // Clone builder hiện tại — dùng để count riêng mà không ảnh hưởng query gốc
  clone() {
    const b = new QueryBuilder(this._model);
    b._query    = JSON.parse(JSON.stringify(this._query));
    b._sort     = { ...this._sort };
    b._page     = this._page;
    b._limit    = this._limit;
    b._populate = [...this._populate];
    b._select   = this._select;
    b._lean     = this._lean;
    b._useVirtuals = this._useVirtuals;
    return b;
  }

  // ─── EXECUTE ─────────────────────────────────────────────────

  // Debug: log query trước khi execute
  debug() {
    logger.debug('QueryBuilder state', {
      query: JSON.stringify(this._query),
      sort: this._sort, page: this._page, limit: this._limit,
    });
    return this;
  }

  async execute() {
    const skip = (this._page - 1) * this._limit;

    let q = this._model
      .find(this._query)
      .sort(this._sort)
      .skip(skip)
      .limit(this._limit)
      .select(this._select);

    this._populate.forEach(f => { q = q.populate(f); });

    if (this._lean) {
      q = this._useVirtuals
        ? q.lean({ virtuals: true })  // Giữ virtual fields (salePrice)
        : q.lean();
    }

    // Chạy song song data + count
    const [data, total] = await Promise.all([
      q.exec(),
      this._model.countDocuments(this._query),
    ]);

    return {
      data,
      pagination: {
        page:       this._page,
        limit:      this._limit,
        total,
        totalPages: Math.ceil(total / this._limit),
        hasNext:    this._page < Math.ceil(total / this._limit),
        hasPrev:    this._page > 1,
      },
    };
  }

  // Chỉ lấy 1 kết quả (không paginate)
  async executeOne() {
    let q = this._model.findOne(this._query).select(this._select);
    this._populate.forEach(f => { q = q.populate(f); });
    if (this._lean) q = q.lean({ virtuals: this._useVirtuals });
    return q.exec();
  }
}

export default QueryBuilder;
```

---

### 2.4 Cách dùng QueryBuilder trong thực tế

```javascript
// controllers/v2/product.controller.js

// ── Cách 1: fromRequest — Controller cực kỳ gọn ──
export const getProducts = catchAsync(async (req, res) => {
  // Tất cả filter logic nằm trong QueryBuilder.fromRequest
  // Controller không cần biết gì về filter
  const result = await QueryBuilder
    .fromRequest(Product, req.query)
    .lean(true) // cần salePrice virtual
    .execute();

  ApiResponse.paginated(result.data, result.pagination).send(res);
});

// ── Cách 2: Chain thủ công — khi cần control nhiều hơn ──
export const getProductsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const { page, limit, sort, minPrice, maxPrice } = req.query;

  const result = await new QueryBuilder(Product)
    .where({ category })         // Bắt buộc có category
    .inStock()                   // Chỉ còn hàng
    .priceRange(minPrice, maxPrice)
    .sortBy(sort || 'soldCount', 'desc') // Mặc định: bán chạy nhất
    .paginate(page, limit)
    .select('-__v')
    .lean(true)
    .execute();

  ApiResponse.paginated(result.data, result.pagination).send(res);
});

// ── Cách 3: Spec filter — đặc thù linh kiện điện tử ──
export const searchBySpecs = catchAsync(async (req, res) => {
  // GET /products/search?RAM=16GB&Storage=512GB&brand=Samsung&maxPrice=20000000
  const result = await QueryBuilder
    .fromRequest(Product, req.query) // Tự parse RAM, Storage từ query
    .lean(true)
    .debug()   // Log query ra để kiểm tra trong dev
    .execute();

  ApiResponse.paginated(result.data, result.pagination).send(res);
});

// ── Cách 4: Kết hợp preset sort ──
export const getFlashSale = catchAsync(async (req, res) => {
  const result = await new QueryBuilder(Product)
    .onSale()          // Đang trong thời gian sale
    .inStock()         // Còn hàng
    .mostDiscounted()  // Sort: giảm nhiều nhất lên đầu
    .paginate(req.query.page, 20) // Flash sale: 20 sản phẩm/trang
    .lean(true)        // Cần salePrice virtual
    .execute();

  ApiResponse.paginated(result.data, result.pagination).send(res);
});

// ── Cách 5: Recommendation — excludeIds ──
export const getSimilarProducts = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);

  const result = await new QueryBuilder(Product)
    .category(product.category)
    .brand(product.brand)
    .excludeIds([product._id])    // Không trả về chính nó
    .inStock()
    .bestSelling()
    .paginate(1, 6)               // Chỉ lấy 6 sản phẩm liên quan
    .lean(true)
    .execute();

  ApiResponse.success(result.data).send(res);
});
```

---

### 2.5 Query URL Examples (Frontend dùng)

```
Tìm laptop RAM 16GB, giá 15-30 triệu, còn hàng, sort rẻ nhất trước:
GET /api/v2/products?search=laptop&RAM=16GB&minPrice=15000000&maxPrice=30000000&inStock=true&sort=price:asc

Flash sale hôm nay:
GET /api/v2/products?onSale=true&sort=discount:desc&limit=20

Laptop Samsung màn 15.6 inch:
GET /api/v2/products?category=laptop&brand=Samsung&Screen Size=15.6 inch

Bán chạy nhất tuần, trang 2:
GET /api/v2/products?sort=soldCount:desc&page=2&limit=12
```

---

## PHASE 3 — Adapter Layer (Third-party Integration)
> **Mục tiêu:** Tách Stripe, VNPay, Momo, Cloudinary ra khỏi business logic.  
> **Thời gian ước tính:** 2-3 ngày

### 3.1 Payment Adapter (Strategy + Adapter kết hợp)

```javascript
// adapters/payment/IPaymentAdapter.js
class IPaymentAdapter {
  async charge({ amount, currency, source, metadata })   { throw new Error('Not implemented'); }
  async generatePaymentUrl({ amount, orderId, returnUrl }) { throw new Error('Not implemented'); }
  async verifyWebhook(payload, signature)                 { throw new Error('Not implemented'); }
  async refund({ transactionId, amount, reason })         { throw new Error('Not implemented'); }
}

// Chuẩn response cho tất cả payment methods:
// {
//   transactionId: string,
//   status: 'success' | 'pending' | 'failed',
//   amount: number,
//   paymentUrl?: string  // VNPay / Momo trả về URL để redirect
// }
```

```javascript
// adapters/payment/StripeAdapter.js
class StripeAdapter extends IPaymentAdapter {
  constructor() {
    super();
    this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  async charge({ amount, currency = 'usd', source, metadata }) {
    const intent = await this._stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency, payment_method: source, metadata, confirm: true,
    });
    return {
      transactionId: intent.id,
      status: intent.status === 'succeeded' ? 'success' : 'pending',
      amount: intent.amount / 100,
    };
  }
  async verifyWebhook(payload, signature) {
    const event = this._stripe.webhooks.constructEvent(
      payload, signature, process.env.STRIPE_WEBHOOK_SECRET
    );
    return {
      transactionId: event.data.object.payment_intent,
      status: event.type === 'payment_intent.succeeded' ? 'success' : 'failed',
    };
  }
  async refund({ transactionId, amount }) {
    const refund = await this._stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return { refundId: refund.id, status: 'success', amount: refund.amount / 100 };
  }
}
```

```javascript
// adapters/payment/VNPayAdapter.js
class VNPayAdapter extends IPaymentAdapter {
  async generatePaymentUrl({ amount, orderId, returnUrl, ipAddr }) {
    // VNPay không "charge" trực tiếp — tạo URL redirect
    const params = {
      vnp_Version: '2.1.0', vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Amount: amount * 100, // VNPay tính theo đồng
      vnp_CurrCode: 'VND', vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_ReturnUrl: returnUrl, vnp_IpAddr: ipAddr,
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
    };
    const sorted = this._sortParams(params);
    const signData = querystring.stringify(sorted);
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sorted.vnp_SecureHash = signed;
    const paymentUrl = `${process.env.VNP_URL}?${querystring.stringify(sorted)}`;
    return { transactionId: orderId, status: 'pending', paymentUrl };
  }

  async verifyWebhook(query) {
    const secureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;
    const sorted = this._sortParams(query);
    const signData = querystring.stringify(sorted);
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    const isValid = secureHash === signed;
    return {
      transactionId: query.vnp_TxnRef,
      status: (isValid && query.vnp_ResponseCode === '00') ? 'success' : 'failed',
    };
  }
}
```

```javascript
// adapters/payment/PaymentAdapterFactory.js
import stripeAdapter from './StripeAdapter.js';
import vnpayAdapter  from './VNPayAdapter.js';
import momoAdapter   from './MomoAdapter.js';

class PaymentAdapterFactory {
  static _adapters = {
    stripe: stripeAdapter,
    vnpay:  vnpayAdapter,
    momo:   momoAdapter,
  };
  static get(method) {
    const adapter = this._adapters[method];
    if (!adapter) throw new AppError(`Unsupported payment method: ${method}`, 400, 'INVALID_PAYMENT_METHOD');
    return adapter;
  }
}
```

### 3.2 Storage Adapter (Cloudinary / Local)

```javascript
// adapters/storage/CloudinaryAdapter.js
class CloudinaryAdapter {
  async upload(fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: options.folder || 'products', resource_type: 'auto', ...options },
        (error, result) => error ? reject(error) : resolve({
          url: result.secure_url, publicId: result.public_id, provider: 'cloudinary',
        })
      );
      uploadStream.end(fileBuffer);
    });
  }

  async delete(publicId) {
    await cloudinary.uploader.destroy(publicId);
    return { deleted: true };
  }

  async uploadMany(files, folder) {
    return Promise.all(files.map(f => this.upload(f.buffer, { folder })));
  }
}

// config/storage.js
import CloudinaryAdapter from './CloudinaryAdapter.js';
import LocalStorageAdapter from './LocalStorageAdapter.js';
export default process.env.NODE_ENV === 'production'
  ? new CloudinaryAdapter()
  : new LocalStorageAdapter();
```

---

## PHASE 4 — Service + Facade Layer
> **Mục tiêu:** Business logic vào Service, orchestration vào Facade.  
> **Thời gian ước tính:** 3-4 ngày

### 4.1 Event System (Observer Pattern)

```javascript
// events/AppEventEmitter.js
import { EventEmitter } from 'events';
class AppEventEmitter extends EventEmitter {
  constructor() { super(); this.setMaxListeners(20); }
  onSafe(event, listener) {
    this.on(event, async (...args) => {
      try { await listener(...args); }
      catch (err) { logger.error(`Listener error: ${event}`, { error: err.message }); }
    });
  }
}
export default new AppEventEmitter();

// events/eventNames.js
export const EVENTS = {
  USER_REGISTERED:     'user:registered',
  USER_VERIFIED_EMAIL: 'user:email_verified',
  ORDER_PLACED:        'order:placed',
  ORDER_PAID:          'order:paid',
  ORDER_CANCELLED:     'order:cancelled',
  ORDER_SHIPPED:       'order:shipped',
  PAYMENT_SUCCESS:     'payment:success',
  PAYMENT_FAILED:      'payment:failed',
  REVIEW_CREATED:      'review:created',
};
```

```javascript
// events/listeners/orderListeners.js
const registerOrderListeners = () => {

  // Khi đặt hàng thành công
  emitter.onSafe(EVENTS.ORDER_PLACED, async (order) => {
    await productRepository.decrementStock(order.items);
  });

  emitter.onSafe(EVENTS.ORDER_PLACED, async (order) => {
    await cartService.clearCart(order.user);
  });

  emitter.onSafe(EVENTS.ORDER_PLACED, async (order) => {
    const user = await userRepository.findById(order.user);
    await emailAdapter.sendOrderConfirmation(user, order);
  });

  // Khi thanh toán xong (Stripe/VNPay/Momo callback)
  emitter.onSafe(EVENTS.ORDER_PAID, async (order) => {
    await invoiceService.generate(order);
  });

  // Khi admin đổi trạng thái → Shipped
  emitter.onSafe(EVENTS.ORDER_SHIPPED, async ({ order, tracking }) => {
    const user = await userRepository.findById(order.user);
    await emailAdapter.sendShippingNotification(user, order, tracking);
  });

  // Khi huỷ đơn
  emitter.onSafe(EVENTS.ORDER_CANCELLED, async (order) => {
    if (order.isPaid) {
      const payment = PaymentAdapterFactory.get(order.paymentMethod);
      await payment.refund({ transactionId: order.transactionId, amount: order.totalPrice });
    }
    await productRepository.incrementStock(order.items);
    const user = await userRepository.findById(order.user);
    await emailAdapter.sendCancellationEmail(user, order);
  });
};
```

### 4.2 OrderFacade (Orchestrate toàn bộ flow đặt hàng)

```javascript
// facades/OrderFacade.js
class OrderFacade {

  async placeOrder(userId, { items, shippingAddress, paymentMethod, coupon }) {
    // 1. Validate stock
    await this._validateStock(items);

    // 2. Tính giá — lấy salePrice nếu đang sale
    const priced = await this._calculatePrices(items);

    // 3. Áp dụng welcome discount nếu user chưa từng mua
    const { discount, isWelcome } = await this._applyDiscount(userId, coupon, priced.itemsPrice);

    // 4. Tạo Order
    const order = await orderRepository.create({
      user: userId,
      items: priced.items,
      shippingAddress,
      paymentMethod,
      itemsPrice: priced.itemsPrice,
      shippingPrice: this._calcShipping(priced.itemsPrice),
      totalPrice: priced.itemsPrice - discount + this._calcShipping(priced.itemsPrice),
      welcomeDiscount: isWelcome,
      welcomeDiscountAmount: discount,
      status: 'pending',
    });

    // 5. Nếu COD → emit ngay
    if (paymentMethod === 'cod') {
      emitter.emit(EVENTS.ORDER_PLACED, order);
      return { order };
    }

    // 6. Nếu online payment → tạo payment URL / intent
    const paymentAdapter = PaymentAdapterFactory.get(paymentMethod);
    const paymentResult = await paymentAdapter.generatePaymentUrl({
      amount: order.totalPrice, orderId: order._id.toString(),
      returnUrl: `${process.env.CLIENT_URL}/order/verify`,
    });

    return { order, paymentUrl: paymentResult.paymentUrl };
  }

  async verifyPayment(orderId, provider, webhookPayload, signature) {
    const paymentAdapter = PaymentAdapterFactory.get(provider);
    const result = await paymentAdapter.verifyWebhook(webhookPayload, signature);

    if (result.status !== 'success') {
      emitter.emit(EVENTS.PAYMENT_FAILED, { orderId, reason: 'Webhook verification failed' });
      throw new AppError('Payment verification failed', 400, 'PAYMENT_FAILED');
    }

    const order = await orderRepository.updateById(orderId, {
      isPaid: true, paidAt: new Date(),
      transactionId: result.transactionId, status: 'confirmed',
    });

    emitter.emit(EVENTS.ORDER_PLACED, order); // Trừ stock, clear cart, gửi email
    emitter.emit(EVENTS.ORDER_PAID, order);   // Tạo invoice
    return order;
  }

  async cancelOrder(orderId, userId, reason) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (order.user.toString() !== userId.toString()) throw new ForbiddenError();
    if (['shipping', 'delivered'].includes(order.status)) {
      throw new AppError('Cannot cancel order in current status', 400, 'CANCEL_NOT_ALLOWED');
    }

    await orderRepository.updateById(orderId, { status: 'cancelled', cancelReason: reason });
    emitter.emit(EVENTS.ORDER_CANCELLED, order);
  }

  _calcShipping(itemsPrice) {
    return itemsPrice >= 500000 ? 0 : 30000; // Free ship trên 500k
  }

  async _validateStock(items) {
    const checks = await Promise.all(
      items.map(async ({ product, quantity }) => {
        const p = await productRepository.findById(product);
        if (!p) throw new NotFoundError('Product');
        if (p.stock < quantity) throw new AppError(`${p.name}: insufficient stock`, 400, 'OUT_OF_STOCK');
        return { ...p, requestedQty: quantity };
      })
    );
    return checks;
  }

  async _calculatePrices(items) {
    const now = new Date();
    const priced = await Promise.all(
      items.map(async ({ product, quantity }) => {
        const p = await productRepository.findById(product, { lean: false }); // cần virtual
        const price = p.salePrice ?? p.price; // Dùng salePrice nếu đang sale
        return {
          product: p._id, name: p.name,
          image: p.images[0], price, quantity,
        };
      })
    );
    const itemsPrice = priced.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items: priced, itemsPrice };
  }
}

export default new OrderFacade();
```

---

## PHASE 5 — Thin Controllers + Validation Pipeline
> **Mục tiêu:** Controllers chỉ còn parse req / gọi facade / trả res.  
> **Thời gian ước tính:** 1-2 ngày

### 5.1 Validation Chain (Chain of Responsibility)

```javascript
// middleware/validateRequest.js
class BaseValidator {
  constructor() { this._next = null; }
  setNext(v) { this._next = v; return v; }
  async passToNext(data) {
    return this._next ? this._next.validate(data) : { valid: true };
  }
}

class RequiredFieldsValidator extends BaseValidator {
  constructor(fields) { super(); this._fields = fields; }
  async validate(data) {
    const missing = this._fields.filter(f => !data[f]);
    if (missing.length) return { valid: false, error: `Missing: ${missing.join(', ')}` };
    return this.passToNext(data);
  }
}

class OrderValidationChain {
  static build() {
    const required = new RequiredFieldsValidator(['items', 'shippingAddress', 'paymentMethod']);
    const paymentMethod = new PaymentMethodValidator(['cod', 'vnpay', 'momo', 'stripe']);
    const itemsFormat = new ItemsFormatValidator();
    required.setNext(paymentMethod).setNext(itemsFormat);
    return required;
  }
}

// Middleware factory
const validate = (chainBuilder) => catchAsync(async (req, res, next) => {
  const chain = chainBuilder.build();
  const result = await chain.validate(req.body);
  if (!result.valid) throw new ValidationError(result.error);
  next();
});
```

### 5.2 Thin Controller (Kết quả cuối)

```javascript
// controllers/v2/order.controller.js
import orderFacade from '../../facades/OrderFacade.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../middleware/catchAsync.js';

export const placeOrder = catchAsync(async (req, res) => {
  const result = await orderFacade.placeOrder(req.user.id, req.body);
  ApiResponse.created(result, 'Order placed successfully').send(res);
});

export const verifyStripePayment = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const order = await orderFacade.verifyPayment(req.body.orderId, 'stripe', req.body, sig);
  ApiResponse.success(order, 'Payment verified').send(res);
});

export const vnpayReturn = catchAsync(async (req, res) => {
  const order = await orderFacade.verifyPayment(req.query.vnp_TxnRef, 'vnpay', req.query, null);
  res.redirect(`${process.env.CLIENT_URL}/order/success/${order._id}`);
});

export const cancelOrder = catchAsync(async (req, res) => {
  await orderFacade.cancelOrder(req.params.orderId, req.user.id, req.body.reason);
  ApiResponse.success(null, 'Order cancelled').send(res);
});

export const getMyOrders = catchAsync(async (req, res) => {
  const result = await orderRepository.paginate(
    { user: req.user.id }, req.query.page, req.query.limit
  );
  ApiResponse.paginated(result.data, result.pagination).send(res);
});
```

---

## 📋 Checklist Refactor

```
PHASE 1 — Foundation
  [ ] AppError + subclasses
  [ ] Winston Logger (Singleton)
  [ ] catchAsync wrapper
  [ ] Global errorHandler
  [ ] ApiResponse Factory
  [ ] requestLogger middleware
  [ ] process.on unhandledRejection/uncaughtException

PHASE 2 — Repository Layer
  [ ] BaseRepository
  [ ] UserRepository
  [ ] ProductRepository (+ decrementStock, searchProducts)
  [ ] OrderRepository
  [ ] ReviewRepository
  [ ] SubscriberRepository
  [ ] QueryBuilder

PHASE 3 — Adapter Layer
  [ ] IPaymentAdapter interface
  [ ] StripeAdapter
  [ ] VNPayAdapter
  [ ] MomoAdapter
  [ ] PaymentAdapterFactory
  [ ] CloudinaryAdapter
  [ ] IStorageAdapter + config/storage.js

PHASE 4 — Service + Event System
  [ ] AppEventEmitter (Singleton)
  [ ] eventNames.js constants
  [ ] userListeners.js
  [ ] orderListeners.js
  [ ] AuthFacade (register, login, verify, oauth)
  [ ] OrderFacade (placeOrder, verifyPayment, cancelOrder)
  [ ] CartService
  [ ] ProductService
  [ ] MarketingFacade (bulk discount, send promo)

PHASE 5 — Controllers + Validation
  [ ] ValidationChain builders (cho từng route)
  [ ] auth.controller.js (thin)
  [ ] order.controller.js (thin)
  [ ] product.controller.js (thin)
  [ ] user.controller.js (thin)
  [ ] Integrate tất cả middleware vào routes
```

---

## 🔁 Clone cho MERN Project Mới

Các phần **100% reusable** — copy nguyên không cần sửa:

```
REUSABLE CORE (copy nguyên)
├── errors/                     → Toàn bộ
├── middleware/catchAsync.js    → Toàn bộ
├── middleware/errorHandler.js  → Toàn bộ
├── middleware/requestLogger.js → Toàn bộ
├── config/logger.js            → Toàn bộ
├── utils/ApiResponse.js        → Toàn bộ
├── utils/QueryBuilder.js       → Toàn bộ
├── repositories/BaseRepository → Toàn bộ
├── events/AppEventEmitter.js   → Toàn bộ
└── events/eventNames.js        → Đổi tên event cho domain mới

REUSABLE WITH CONFIG (copy + đổi env)
├── adapters/payment/           → Đổi credentials
├── adapters/storage/           → Đổi folder names
└── config/database.js          → Đổi MONGO_URI

DOMAIN-SPECIFIC (viết mới)
├── models/                     → Schema cho domain mới
├── repositories/*Repository.js → Kế thừa BaseRepository
├── services/                   → Business logic mới
├── facades/                    → Orchestration mới
└── controllers/                → Thin, gọi facades
```

---

## 🧱 Nguyên tắc khi thêm Feature mới (sau refactor)

```
1. Thêm Model → Repository kế thừa BaseRepository
2. Business logic → Service (không biết về HTTP)
3. Orchestration → Facade nếu cần nhiều services
4. Side effects → Emit event, đăng ký listener
5. HTTP layer → Controller gọi Facade/Service
6. Validation → ValidationChain
7. Response → ApiResponse.success/created/paginated
8. Error → throw AppError (errorHandler lo phần còn lại)
```

---

# 🔮 Future Features — Roadmap Mở Rộng

> Mỗi feature dưới đây được gắn với **Design Pattern** cụ thể,
> **điều kiện nên thêm** (đừng over-engineer sớm),
> và **cách tích hợp** vào kiến trúc hiện tại mà không phá vỡ gì.

---

## ⚡ NHÓM 1 — Performance

---

### F1.1 — Caching Layer (Proxy Pattern)

**Pattern:** Proxy  
**Thêm khi:** Có > 1000 request/ngày, thấy DB query lặp lại nhiều  
**Package:** `ioredis`

```
Request → CachedRepository (Proxy) → [Cache HIT] → Redis → trả về ngay
                                   → [Cache MISS] → MongoDB → lưu Redis → trả về
```

```javascript
// proxies/CachedProductRepository.js
class CachedProductRepository {
  constructor(repo, redis, ttl = 300) {
    this._repo = repo;
    this._redis = redis;
    this._ttl = ttl;
  }

  _key(...parts) { return `product:${parts.join(':')}`; }

  async findById(id, options) {
    const key = this._key('id', id);
    try {
      const cached = await this._redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      logger.warn('Redis GET failed, falling through to DB', { key });
    }
    const result = await this._repo.findById(id, options);
    if (result) {
      await this._redis.setex(key, this._ttl, JSON.stringify(result))
            .catch(() => {}); // Redis lỗi không crash app
    }
    return result;
  }

  async updateById(id, data) {
    const result = await this._repo.updateById(id, data);
    await this._redis.del(this._key('id', id)).catch(() => {});
    return result;
  }

  // Cache toàn bộ danh sách product (dùng cho trang chủ)
  async findAll(filter, options) {
    const key = this._key('list', JSON.stringify(filter));
    try {
      const cached = await this._redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const result = await this._repo.findAll(filter, options);
    await this._redis.setex(key, 60, JSON.stringify(result)).catch(() => {}); // TTL ngắn hơn
    return result;
  }

  // Invalidate tất cả cache liên quan đến product list
  async invalidateListCache() {
    const keys = await this._redis.keys('product:list:*');
    if (keys.length) await this._redis.del(...keys);
  }
}

// config/repositories.js — switch dựa trên env
export const productRepo = process.env.REDIS_URL
  ? new CachedProductRepository(productRepository, redis)
  : productRepository;
```

**Tích hợp vào kiến trúc:** Chỉ đổi import trong services — không sửa gì khác.  
**Cache nên lưu:** Product detail, Product list (trang chủ), Setting/Banners, Admin stats.  
**Không nên cache:** Cart, Order, User profile (dữ liệu cá nhân, thay đổi thường xuyên).

---

### F1.2 — Rate Limiting (Proxy Pattern)

**Pattern:** Proxy  
**Thêm khi:** Có API public, lo brute force login, spam đặt hàng  
**Package:** `express-rate-limit` + `rate-limit-redis`

```javascript
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Factory tạo limiter với config khác nhau
const createLimiter = (options) => rateLimit({
  windowMs: options.windowMs || 15 * 60 * 1000, // 15 phút
  max: options.max || 100,
  message: { success: false, errorCode: 'RATE_LIMIT_EXCEEDED', message: options.message || 'Too many requests' },
  store: process.env.REDIS_URL ? new RedisStore({ client: redis }) : undefined,
  keyGenerator: options.keyGenerator || ((req) => req.ip),
});

// Các limiter cho từng use case
export const globalLimiter = createLimiter({ max: 200, windowMs: 15 * 60 * 1000 });

export const authLimiter = createLimiter({
  max: 5,               // Chỉ 5 lần login sai
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Try again in 15 minutes.',
  keyGenerator: (req) => `${req.ip}:${req.body.email}`, // Per IP + email
});

export const orderLimiter = createLimiter({
  max: 10,              // 10 đơn / 1 giờ
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => req.user?.id || req.ip,
});

export const uploadLimiter = createLimiter({
  max: 20,             // 20 uploads / giờ
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => req.user?.id,
});
```

```javascript
// routes/v2/auth.routes.js
router.post('/login', authLimiter, authController.login);   // Giới hạn login
router.post('/register', authLimiter, authController.register);

// routes/v2/order.routes.js
router.post('/place', protect, orderLimiter, orderController.placeOrder);
```

---

### F1.3 — Response Compression + HTTP Caching Headers

**Pattern:** Decorator  
**Thêm khi:** Bundle size lớn, muốn tiết kiệm bandwidth  
**Package:** `compression`

```javascript
// v2.js
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    // Không compress streaming responses
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // 0-9, tradeoff giữa speed và compression ratio
}));

// middleware/cacheHeaders.js — Cache-Control cho static-ish data
export const cachePublic = (maxAge = 300) => (req, res, next) => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`);
  next();
};

export const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
};

// Routes dùng:
router.get('/products', cachePublic(60), productController.getAll);  // Cache 1 phút
router.get('/setting/config', cachePublic(300), settingController.get); // Cache 5 phút
router.get('/profile', noCache, userController.getProfile);           // Không cache
```

---

## 🔒 NHÓM 2 — Security

---

### F2.1 — Security Proxy Middleware Stack

**Pattern:** Proxy + Chain of Responsibility  
**Thêm khi:** Chuẩn bị lên production  
**Package:** `helmet`, `express-mongo-sanitize`, `hpp`

```javascript
// middleware/securityMiddleware.js
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Mỗi middleware = một Proxy bảo vệ request
export const securityChain = [

  // 1. HTTP headers bảo mật (XSS, clickjacking, MIME sniffing...)
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
        scriptSrc: ["'self'"],
      },
    },
  }),

  // 2. Sanitize MongoDB operators trong body/query
  // Ngăn: { "email": { "$gt": "" } } injection
  mongoSanitize({ replaceWith: '_' }),

  // 3. Chặn HTTP Parameter Pollution
  // Ngăn: ?sort=price&sort=name (chỉ lấy giá trị cuối)
  hpp({ whitelist: ['price', 'category', 'brand'] }),

  // 4. Limit request body size
  express.json({ limit: '10kb' }),       // JSON max 10KB
  express.urlencoded({ extended: true, limit: '10kb' }),
];

// v2.js
securityChain.forEach(middleware => app.use(middleware));
```

---

### F2.2 — Audit Log (Observer + Decorator)

**Pattern:** Observer + Decorator  
**Thêm khi:** Cần track "ai làm gì lúc nào" — quan trọng cho admin actions  
**Model mới:** `AuditLog`

```javascript
// models/v2/AuditLog.js
const auditLogSchema = new Schema({
  actor: { type: ObjectId, ref: 'User' },   // Ai làm
  action: String,                            // 'UPDATE_PRODUCT', 'DELETE_ORDER'
  resource: String,                          // 'Product', 'Order'
  resourceId: ObjectId,
  before: Schema.Types.Mixed,               // Snapshot trước khi thay đổi
  after: Schema.Types.Mixed,                // Snapshot sau khi thay đổi
  ip: String,
  userAgent: String,
}, { timestamps: true });

// repositories/AuditLogRepository.js
class AuditLogRepository extends BaseRepository {
  constructor() { super(AuditLog); }
  async log({ actor, action, resource, resourceId, before, after, req }) {
    return this.create({
      actor, action, resource, resourceId, before, after,
      ip: req?.ip, userAgent: req?.headers['user-agent'],
    });
  }
}

// events/listeners/auditListeners.js
const registerAuditListeners = () => {
  // Lắng nghe mọi admin action qua Observer
  emitter.onSafe(EVENTS.PRODUCT_UPDATED, async ({ before, after, adminId, req }) => {
    await auditLogRepository.log({
      actor: adminId, action: 'UPDATE_PRODUCT',
      resource: 'Product', resourceId: after._id,
      before, after, req,
    });
  });

  emitter.onSafe(EVENTS.ORDER_STATUS_CHANGED, async ({ order, oldStatus, adminId, req }) => {
    await auditLogRepository.log({
      actor: adminId, action: 'CHANGE_ORDER_STATUS',
      resource: 'Order', resourceId: order._id,
      before: { status: oldStatus }, after: { status: order.status }, req,
    });
  });
};
```

```javascript
// Decorator: tự động log trước khi thực thi admin action
const withAuditLog = (action, resource) => (fn) => {
  return catchAsync(async (req, res) => {
    const before = await getResourceSnapshot(resource, req.params.id);
    const result = await fn(req, res);
    const after = await getResourceSnapshot(resource, req.params.id);
    emitter.emit(`admin:${action}`, { before, after, adminId: req.user.id, req });
    return result;
  });
};

// Dùng:
export const updateProduct = withAuditLog('UPDATE_PRODUCT', 'Product')(
  catchAsync(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    ApiResponse.success(product).send(res);
  })
);
```

---

### F2.3 — Refresh Token + Token Rotation (Strategy Pattern)

**Pattern:** Strategy  
**Thêm khi:** Muốn session tồn tại lâu nhưng vẫn an toàn  

```javascript
// strategies/auth/TokenStrategy.js
class TokenStrategy {
  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Ngắn
  }
  generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }
  async saveRefreshToken(userId, token) {
    // Lưu hashed token vào DB (không lưu raw)
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    await RefreshToken.create({ userId, token: hashed, expiresAt: new Date(Date.now() + 7 * 86400000) });
    return token;
  }
  async rotate(refreshToken) {
    // Xác thực → xoá cái cũ → cấp cái mới (Token Rotation)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await RefreshToken.findOneAndDelete({ token: hashed });
    if (!stored) throw new UnauthorizedError('Refresh token reuse detected');
    const newRefresh = await this.saveRefreshToken(decoded.userId, this.generateRefreshToken(decoded.userId));
    const newAccess = this.generateAccessToken(decoded.userId, decoded.role);
    return { accessToken: newAccess, refreshToken: newRefresh };
  }
}

// Route:
// POST /auth/refresh → tokenStrategy.rotate(req.cookies.refreshToken)
// POST /auth/logout  → xoá refreshToken khỏi DB + clear cookie
```

---

### F2.4 — Permission System nâng cao (Proxy + Strategy)

**Pattern:** Proxy  
**Thêm khi:** Cần phân quyền chi tiết hơn `user/admin` đơn giản  

```javascript
// middleware/permissions.js
// Thay vì chỉ check role, check permission cụ thể

const PERMISSIONS = {
  'product:read':   ['user', 'admin', 'manager'],
  'product:write':  ['admin', 'manager'],
  'product:delete': ['admin'],
  'order:read:own': ['user', 'admin'],
  'order:read:all': ['admin', 'manager'],
  'order:update':   ['admin', 'manager'],
  'user:manage':    ['admin'],
  'marketing:send': ['admin', 'marketing'],
};

export const can = (permission) => (req, res, next) => {
  const userRole = req.user?.role;
  const allowed = PERMISSIONS[permission] || [];
  if (!allowed.includes(userRole)) {
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
  next();
};

// Route dùng:
router.delete('/:id', protect, can('product:delete'), productController.delete);
router.post('/send-promo', protect, can('marketing:send'), marketingController.sendPromo);
```

---

## 📈 NHÓM 3 — Scale

---

### F3.1 — Job Queue (Command Pattern)

**Pattern:** Command  
**Thêm khi:** Có tác vụ nặng không cần trả kết quả ngay (gửi email hàng loạt, resize ảnh, export Excel)  
**Package:** `bullmq` + Redis

```
Request → Controller → Queue (thêm job) → Response ngay lập tức
                            ↓
                       Worker (xử lý ngầm)
                            ↓
                    Xong → emit event / webhook
```

```javascript
// queues/QueueManager.js — Singleton
import { Queue, Worker } from 'bullmq';

class QueueManager {
  constructor() {
    if (QueueManager._instance) return QueueManager._instance;
    this._queues = new Map();
    this._workers = new Map();
    this._connection = { host: process.env.REDIS_HOST, port: 6379 };
    QueueManager._instance = this;
  }

  getQueue(name) {
    if (!this._queues.has(name)) {
      this._queues.set(name, new Queue(name, { connection: this._connection }));
    }
    return this._queues.get(name);
  }

  registerWorker(queueName, processor, options = {}) {
    const worker = new Worker(queueName, processor, {
      connection: this._connection,
      concurrency: options.concurrency || 5,
    });
    worker.on('completed', (job) => logger.info(`Job completed: ${queueName}`, { jobId: job.id }));
    worker.on('failed', (job, err) => logger.error(`Job failed: ${queueName}`, { jobId: job?.id, error: err.message }));
    this._workers.set(queueName, worker);
    return worker;
  }
}

export default new QueueManager();
```

```javascript
// queues/processors/emailProcessor.js
// Worker xử lý email queue
const emailProcessor = async (job) => {
  const { type, to, data } = job.data;
  switch (type) {
    case 'order_confirmation':
      await emailAdapter.sendOrderConfirmation(to, data);
      break;
    case 'bulk_promo':
      await emailAdapter.sendPromoEmail(to, data);
      break;
    case 'shipping_notification':
      await emailAdapter.sendShippingNotification(to, data);
      break;
  }
};

// queues/processors/imageProcessor.js
const imageProcessor = async (job) => {
  const { imageUrl, productId, sizes } = job.data;
  // Resize ảnh sang nhiều kích thước (thumbnail, medium, large)
  for (const size of sizes) {
    const resized = await sharp(imageUrl).resize(size.w, size.h).toBuffer();
    await storageAdapter.upload(resized, `products/${productId}-${size.label}.jpg`);
  }
};

// Khởi động workers khi app start
queueManager.registerWorker('emails', emailProcessor, { concurrency: 10 });
queueManager.registerWorker('images', imageProcessor, { concurrency: 3 });

// Service dùng queue thay vì gửi email trực tiếp:
const emailQueue = queueManager.getQueue('emails');

// Thay vì: await emailAdapter.sendOrderConfirmation(user, order)
// Dùng:    await emailQueue.add('send', { type: 'order_confirmation', to: user.email, data: order })
// → Response về ngay, email gửi ngầm
```

---

### F3.2 — Real-time với WebSocket (Observer Pattern)

**Pattern:** Observer  
**Thêm khi:** Cần live update (trạng thái đơn hàng, thông báo, admin dashboard live)  
**Package:** `socket.io`

```javascript
// config/socket.js — Singleton
class SocketManager {
  constructor() {
    if (SocketManager._instance) return SocketManager._instance;
    this._io = null;
    SocketManager._instance = this;
  }

  init(server) {
    this._io = new Server(server, {
      cors: { origin: process.env.CLIENT_URL, credentials: true }
    });

    this._io.use(async (socket, next) => {
      // Auth middleware cho socket
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.join(`user:${decoded.userId}`); // Mỗi user vào room riêng
        next();
      } catch (err) { next(new Error('Authentication error')); }
    });

    return this._io;
  }

  // Gửi đến 1 user cụ thể
  emitToUser(userId, event, data) {
    this._io?.to(`user:${userId}`).emit(event, data);
  }

  // Broadcast đến tất cả (admin dashboard)
  broadcast(event, data) {
    this._io?.emit(event, data);
  }
}

export default new SocketManager();
```

```javascript
// Kết nối Observer với WebSocket:
// events/listeners/realtimeListeners.js
const registerRealtimeListeners = () => {

  emitter.onSafe(EVENTS.ORDER_STATUS_CHANGED, async ({ order }) => {
    // Notify user khi đơn hàng đổi trạng thái
    socketManager.emitToUser(order.user.toString(), 'order:status_updated', {
      orderId: order._id, status: order.status
    });
  });

  emitter.onSafe(EVENTS.ORDER_PLACED, async (order) => {
    // Notify admin dashboard có đơn mới
    socketManager.broadcast('admin:new_order', {
      orderId: order._id, total: order.totalPrice
    });
  });
};

// Frontend React dùng:
// socket.on('order:status_updated', ({ orderId, status }) => {
//   updateOrderStatus(orderId, status); // Update UI realtime
// });
```

---

### F3.3 — Health Check + Graceful Shutdown

**Pattern:** Facade  
**Thêm khi:** Deploy lên server thật, dùng với Docker/PM2/K8s  

```javascript
// routes/health.js
router.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    mongoose.connection.db.admin().ping(),           // MongoDB
    redis.ping(),                                    // Redis
    emailQueue.getWorkers().then(w => w.length > 0), // Queue workers
  ]);

  const [db, cache, queue] = checks.map(c => c.status === 'fulfilled');

  const status = db ? 'healthy' : 'unhealthy';
  res.status(db ? 200 : 503).json({
    status, timestamp: new Date().toISOString(),
    services: { database: db, cache, queue }
  });
});

// v2.js — Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // 1. Ngừng nhận request mới
  server.close(async () => {
    logger.info('HTTP server closed');

    // 2. Đợi jobs đang chạy hoàn thành (tối đa 30s)
    await Promise.race([
      queueManager.closeAll(),
      new Promise(r => setTimeout(r, 30000))
    ]);

    // 3. Đóng DB connection
    await mongoose.connection.close();
    await redis.quit();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
```

---

## 💼 NHÓM 4 — Business Features

---

### F4.1 — Product Recommendation (Strategy Pattern)

**Pattern:** Strategy  
**Thêm khi:** Muốn tăng conversion, có đủ dữ liệu order  

```javascript
// strategies/recommendation/IRecommendationStrategy.js
class IRecommendationStrategy {
  async recommend(userId, productId, limit) {
    throw new Error('Not implemented');
  }
}

// strategies/recommendation/CollaborativeFilteringStrategy.js
// "Người mua sản phẩm này cũng mua..."
class CollaborativeFilteringStrategy extends IRecommendationStrategy {
  async recommend(userId, productId, limit = 6) {
    // Tìm users đã mua cùng product
    const cobuyers = await Order.distinct('user', {
      'items.product': productId,
      user: { $ne: userId }
    });

    // Tìm products họ đã mua nhưng user chưa mua
    const userOrders = await Order.distinct('items.product', { user: userId });
    return Product.find({
      _id: {
        $in: await Order.distinct('items.product', { user: { $in: cobuyers } }),
        $nin: userOrders,
        $ne: productId,
      }
    }).limit(limit).lean({ virtuals: true });
  }
}

// strategies/recommendation/ContentBasedStrategy.js
// "Sản phẩm tương tự — cùng category, brand"
class ContentBasedStrategy extends IRecommendationStrategy {
  async recommend(userId, productId, limit = 6) {
    const product = await Product.findById(productId);
    return Product.find({
      _id: { $ne: productId },
      $or: [{ category: product.category }, { brand: product.brand }],
    })
    .sort({ soldCount: -1 })
    .limit(limit)
    .lean({ virtuals: true });
  }
}

// strategies/recommendation/TrendingStrategy.js
// "Bán chạy nhất tuần này"
class TrendingStrategy extends IRecommendationStrategy {
  async recommend(userId, productId, limit = 6) {
    const lastWeek = new Date(Date.now() - 7 * 86400000);
    const trending = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeek }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return Product.find({ _id: { $in: trending.map(t => t._id) } }).lean({ virtuals: true });
  }
}

// services/recommendationService.js
class RecommendationService {
  constructor() {
    this._strategies = {
      collaborative: new CollaborativeFilteringStrategy(),
      contentBased:  new ContentBasedStrategy(),
      trending:      new TrendingStrategy(),
    };
  }

  async getRecommendations(userId, productId) {
    // Nếu đủ dữ liệu → dùng collaborative, không thì fallback
    const orderCount = await Order.countDocuments({ user: userId });
    const strategy = orderCount >= 3
      ? this._strategies.collaborative
      : this._strategies.contentBased;

    return strategy.recommend(userId, productId, 6);
  }
}
```

---

### F4.2 — Analytics & Dashboard (Observer Pattern)

**Pattern:** Observer  
**Thêm khi:** Muốn track behavior user, đo conversion  

```javascript
// models/v2/AnalyticsEvent.js
const analyticsEventSchema = new Schema({
  event: String,          // 'product_viewed', 'add_to_cart', 'order_placed'
  userId: ObjectId,
  sessionId: String,
  data: Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, { timestamps: true });
// TTL index — tự xoá sau 90 ngày
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });

// services/analyticsService.js
class AnalyticsService {
  async track(event, data, req) {
    // Async — không block response
    setImmediate(async () => {
      try {
        await AnalyticsEvent.create({
          event, userId: data.userId, sessionId: req?.cookies?.sessionId,
          data, ip: req?.ip, userAgent: req?.headers['user-agent'],
        });
      } catch (err) {
        logger.warn('Analytics tracking failed', { event, error: err.message });
      }
    });
  }

  async getDashboardStats(startDate, endDate) {
    const [revenue, orders, newUsers, topProducts] = await Promise.all([
      // Doanh thu theo ngày
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, isPaid: true } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      // Top sản phẩm bán chạy
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]),
    ]);
    return { revenue, orders, newUsers, topProducts };
  }
}

// Observer kết nối analytics
emitter.onSafe(EVENTS.ORDER_PLACED, async (order) => {
  await analyticsService.track('order_placed', {
    userId: order.user, orderId: order._id,
    total: order.totalPrice, itemCount: order.items.length,
  });
});
```

---

### F4.3 — Coupon / Voucher System (Strategy + Chain of Responsibility)

**Pattern:** Strategy + Chain  
**Thêm khi:** Muốn chạy khuyến mãi linh hoạt  

```javascript
// strategies/discount/IDiscountStrategy.js
class IDiscountStrategy {
  apply(order, coupon) { throw new Error('Not implemented'); }
  isApplicable(order, coupon) { throw new Error('Not implemented'); }
}

// strategies/discount/PercentageDiscountStrategy.js
class PercentageDiscountStrategy extends IDiscountStrategy {
  isApplicable(order, coupon) {
    return coupon.type === 'percentage' && order.itemsPrice >= (coupon.minOrderValue || 0);
  }
  apply(order, coupon) {
    const discount = Math.min(
      order.itemsPrice * (coupon.value / 100),
      coupon.maxDiscount || Infinity
    );
    return { discount, description: `${coupon.value}% off` };
  }
}

// strategies/discount/FreeShippingStrategy.js
class FreeShippingStrategy extends IDiscountStrategy {
  isApplicable(order, coupon) {
    return coupon.type === 'free_shipping' && order.itemsPrice >= (coupon.minOrderValue || 0);
  }
  apply(order, coupon) {
    return { discount: order.shippingPrice, description: 'Free shipping' };
  }
}

// Chain of Responsibility — validate coupon trước khi apply
class CouponValidator {
  static async validate(coupon, userId, order) {
    if (!coupon || !coupon.isActive) throw new ValidationError('Invalid coupon');
    if (coupon.expiresAt < new Date()) throw new ValidationError('Coupon expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ValidationError('Coupon usage limit reached');
    // Per-user limit
    const userUsage = await CouponUsage.countDocuments({ coupon: coupon._id, user: userId });
    if (userUsage >= (coupon.perUserLimit || 1)) throw new ValidationError('You have already used this coupon');
    return true;
  }
}
```

---

## 📊 Tổng quan Feature Map

```
                        PRIORITY
FEATURE                 Low    Medium   High    PATTERN
──────────────────────────────────────────────────────────────
Rate Limiting                           ✅      Proxy
Security Headers                        ✅      Chain of Resp.
Refresh Token                    ✅             Strategy
Caching (Redis)                  ✅             Proxy
Audit Log                        ✅             Observer+Decorator
Job Queue (Email)                ✅             Command
Real-time (Socket.io)    ✅                     Observer
Recommendation           ✅                     Strategy
Analytics                ✅                     Observer
Coupon System            ✅                     Strategy+Chain
Permission nâng cao      ✅                     Proxy
Health Check                            ✅      Facade
Graceful Shutdown                       ✅      Facade
```

---

## 🔁 Cập nhật Clone Template

Bổ sung các phần reusable mới:

```
REUSABLE CORE (copy nguyên — bổ sung)
├── middleware/rateLimiter.js       → Đổi max/windowMs theo use case
├── middleware/securityMiddleware.js → Copy nguyên
├── middleware/cacheHeaders.js      → Copy nguyên
├── proxies/CachedRepository.js     → Copy nguyên, wrap repo cụ thể
├── queues/QueueManager.js          → Copy nguyên
├── config/socket.js                → Copy nguyên
├── utils/healthCheck.js            → Đổi services cần check
└── strategies/auth/TokenStrategy.js → Copy nguyên

REUSABLE WITH ADAPTATION
├── strategies/recommendation/      → Đổi fields filter cho domain mới
├── services/analyticsService.js    → Đổi events cần track
└── strategies/discount/            → Copy, thêm loại discount mới
```
