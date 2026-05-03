# 🏗️ Backend MERN (v2) - Context, Architecture, Flow & API Docs

Tài liệu này phân tích chi tiết về bối cảnh (context) hiện tại của mã nguồn thư mục `backend/` (phiên bản `v2`). Bao gồm cấu trúc, đối tượng (objects), luồng dữ liệu (flow), API Documentation và kế hoạch refactor theo chuẩn Best Practices của MERN Stack.

---

## 1. 📂 Cấu trúc thư mục & Tổng quan Kiến trúc
Kiến trúc hiện tại đi theo hướng **Monolithic API** với mô hình MVC (chỉ có Model & Controller):
- `backend/v2.js`: **Entry Point**. Khởi tạo Express, kết nối MongoDB, Cloudinary, thiết lập Middleware (CORS, Cookie-Parser, Passport) và gán `Routes`.
- `backend/config/`: Các file thiết lập dùng chung (Database, Cloudinary, Passport).
- `backend/models/v2/`: Định nghĩa Mongoose Schemas riêng cho v2 (tách biệt với v1 ở thư mục gốc `backend/models`).
- `backend/routes/v2/`: Định nghĩa HTTP endpoints (`/api/v2/*`).
- `backend/middleware/v2/`: Chứa `auth.middleware.js` (Xác thực JWT `protect`, phân quyền `adminOnly`). Riêng `multer.js` dùng chung đang nằm ở `backend/middleware/multer.js`.
- `backend/controllers/v2/`: **Fat Controllers** (Nơi xử lý chính: parse request, logic kinh doanh, lưu Database, trả response).
- `backend/services/`: Dùng chung, hiện tại chỉ chứa logic giao tiếp bên thứ 3 (Email, VnPay, Momo). Chưa có Domain Services riêng cho v2.

---

## 2. 🧩 Objects & Data Models (Domain Entities - `backend/models/v2/`)

Toàn bộ các Schema dưới đây đều được định nghĩa trong thư mục `backend/models/v2/` và được khởi tạo với tuỳ chọn `timestamps: true`.

### 2.1. Product (`Product.js`)
- **Cấu trúc:** `name`, `description`, `price`, `images` (Array of Strings), `category`, `brand`, `specifications` (Array các object `{key, value}`), `note`, `stock` (Mặc định 10000), `soldCount`, `discount` (0-100%), `saleStartAt`, `saleEndAt`.
- **Behavioral (Hành vi):** 
  - Mongoose Virtual Field `salePrice` tự động tính giá sau khi giảm giá (`discount`) nếu thời gian hiện tại nằm trong khoảng `saleStartAt` và `saleEndAt`.

### 2.2. User (`User.js`)
- **Cấu trúc:** `name`, `email` (index), `password` (ẩn), `avatar` (URL Cloudinary), `role` (`user`, `admin`), `isActive`, `isEmailVerified`, `emailVerificationToken` (ẩn), `emailVerificationExpires` (ẩn).
- **Mối quan hệ:** 
  - `cart`: Mảng các object `{ product (ObjectId), quantity }`.
  - `addresses`: Mảng các object thông tin vận chuyển chi tiết (`fullName`, `phone`, `street`, `ward`, `district`, `province`, `isDefault`, `lat`, `lng`, `placeId`).
  - `favorites`: Mảng các `ObjectId` trỏ tới `Product`.

### 2.3. Order (`Order.js`)
- **Cấu trúc:** `user` (ObjectId), `items` (Lưu lại snapshot: `product`, `name`, `image`, `price`, `quantity`), `shippingAddress` (Snapshot của địa chỉ), `paymentMethod` (`cod`, `vnpay`, `momo`, `paypal`, `stripe`), `itemsPrice`, `shippingPrice`, `totalPrice`, `isPaid`, `paidAt`, `status` (`pending`, `confirmed`, `shipping`, `delivered`, `cancelled`), `welcomeDiscount` (Boolean), `welcomeDiscountAmount`.
- **Behavioral:** Lưu trữ độc lập snapshot của các mặt hàng và địa chỉ vào lúc đặt, giúp bảo toàn dữ liệu lịch sử ngay cả khi Product hoặc User Address bị thay đổi sau này.

### 2.4. Review (`Review.js`)
- **Cấu trúc:** `product` (ObjectId), `user` (ObjectId), `rating` (1-5), `comment`, `media` (Mảng URL ảnh/video upload), `isHidden` (Dành cho Admin ẩn đánh giá xấu).

### 2.5. Setting (`Setting.js`)
- **Cấu trúc:** Dùng để lưu trữ cấu hình hệ thống (như UI/Banners). Chứa mảng `banners` gồm các object `{ name, url, isActive }`.

### 2.6. Subscriber (`Subscriber.js`)
- **Cấu trúc:** `email` (unique, lowercase), `isActive` (nhận bản tin). Dùng cho tính năng email marketing.

---

## 3. 🌐 API Documentation (Phiên bản v2)
Tất cả các API dưới đây đều mang tiền tố: `http://localhost:5000/api/v2/`

> **Ký hiệu Middleware:**
> 🔒 `Protect`: Yêu cầu user đã đăng nhập (JWT token gửi qua Cookie).
> 🛡️ `AdminOnly`: Yêu cầu `req.user.role === "admin"`.

### 3.1. Auth (`/auth`)
- `POST /register`: Đăng ký tài khoản (tự động tạo token verify email).
- `POST /login`: Đăng nhập (Set Cookie).
- `POST /logout` 🔒: Xóa JWT Cookie.
- `GET /verify-email`: Xác thực email bằng token (Query string).
- `POST /resend-verification` 🔒: Gửi lại email xác thực.
- `GET /google` & `/google/callback`: Đăng nhập/Đăng ký qua Google.
- `GET /facebook` & `/facebook/callback`: Đăng nhập/Đăng ký qua Facebook.

### 3.2. User & Profile (`/users`)
- `GET /profile` 🔒: Lấy thông tin user hiện tại.
- `PUT /profile` 🔒: Cập nhật thông tin cá nhân.
- `POST /avatar` 🔒: Upload ảnh đại diện (Multer `avatar`).
- `GET /favorites` 🔒: Lấy danh sách sản phẩm yêu thích.
- `POST /favorites/:productId` 🔒: Thêm vào mục yêu thích.
- `DELETE /favorites/:productId` 🔒: Bỏ yêu thích.
- `POST /addresses` 🔒: Thêm địa chỉ nhận hàng.
- `PUT /addresses/:addressId` 🔒: Sửa địa chỉ nhận hàng.
- `DELETE /addresses/:addressId` 🔒: Xóa địa chỉ.

### 3.3. Product (`/products`)
- `GET /`: Lấy danh sách sản phẩm (Hỗ trợ phân trang, lọc category, brand, search, giá). Public.
- `GET /:productId`: Lấy chi tiết một sản phẩm. Public.
- `GET /admin` 🔒🛡️: Lấy tất cả sản phẩm (cho bảng quản trị).
- `POST /` 🔒🛡️: Tạo sản phẩm (Hỗ trợ upload `img1`, `img2`, `img3`, `img4`).
- `POST /bulk-import` 🔒🛡️: Thêm nhiều sản phẩm cùng lúc bằng JSON data từ Excel.
- `PUT /:productId` 🔒🛡️: Sửa sản phẩm.
- `DELETE /:productId` 🔒🛡️: Xóa sản phẩm.
- `GET /:productId/reviews`: Xem danh sách đánh giá của sản phẩm.
- `PUT /:productId/reviews/:reviewId` 🔒: Chỉnh sửa bài đánh giá.
- `DELETE /:productId/reviews/:reviewId` 🔒🛡️: Admin xóa bài đánh giá vi phạm.

### 3.4. Cart (`/cart`)
- `GET /` 🔒: Xem giỏ hàng.
- `POST /` 🔒: Thêm vào giỏ hàng.
- `DELETE /:productId` 🔒: Bớt/Xóa khỏi giỏ hàng.

### 3.5. Order (`/orders`)
- `POST /place` 🔒: Đặt hàng thanh toán khi nhận hàng (COD).
- `POST /stripe` 🔒: Đặt hàng trả qua thẻ (Stripe).
- `POST /momo` 🔒: Đặt hàng trả qua Momo.
- `POST /vnpay` 🔒: Đặt hàng trả qua VNPay.
- `GET /my` 🔒: Lấy danh sách đơn hàng cá nhân của User.
- `GET /` 🔒🛡️: Lấy danh sách toàn bộ đơn hàng (Admin).
- `PUT /status` 🔒🛡️: Admin đổi trạng thái đơn hàng (Confirmed, Shipping, Delivered...).
- `POST /verify-stripe` 🔒: Xác nhận kết quả thanh toán Stripe từ Client.
- `POST /momo-ipn`: Webhook Momo báo kết quả giao dịch (Không protect).
- `GET /vnpay-return`: URL Redirect trả về từ VNPay.
- `PATCH /:orderId/cancel` 🔒: Hủy đơn hàng.
- `POST /:orderId/contact` 🔒: Liên hệ hỗ trợ về đơn hàng.

### 3.6. Reviews (`/reviews`)
- `POST /` 🔒: Viết đánh giá sản phẩm (Upload ảnh qua `media1`, `media2`).

### 3.7. Marketing & Subscribers (`/marketing`, `/subscribers`)
- `POST /subscribers`: Đăng ký nhận bản tin (Public).
- `GET /subscribers/unsubscribe`: Hủy nhận email bản tin.
- `GET /subscribers` 🔒🛡️: Admin xem danh sách subscribers.
- `POST /marketing/send-promo` 🔒🛡️: Admin gửi email khuyến mãi hàng loạt cho Subscriber.
- `POST /marketing/bulk-discount` 🔒🛡️: Admin set giảm giá cho hàng loạt sản phẩm.
- `POST /marketing/remove-discount` 🔒🛡️: Admin xóa giảm giá hàng loạt.

### 3.8. Settings & Admin Stats (`/setting`, `/admin`)
- `GET /admin/stats` 🔒🛡️: Lấy doanh thu, tổng số user, order cho Dashboard.
- `GET /setting/config` 🔒🛡️: Xem cấu hình hệ thống (Banners).
- `POST /setting/banners` 🔒🛡️: Upload banner mới (`img`).
- `PUT /setting/banners/:index` 🔒🛡️: Chuyển đổi trạng thái Active của Banner.

---

## 4. 🔄 Behavioral Patterns & Data Flow (v2 hiện tại)
- **Luồng Auth & Verification:**
  - Client gửi thông tin đăng ký -> Tạo User + Sinh `emailVerificationToken` (Random hex) -> Gửi Email -> Client click link -> API Verify cập nhật `isEmailVerified = true`.
- **Luồng Thanh Toán (Payment Flows):**
  - **COD:** Đặt hàng -> Tính tổng tiền -> Lưu DB trạng thái `pending`.
  - **Stripe:** Trả về `clientSecret` -> Client thanh toán thẻ -> Gọi API `/verify-stripe` để xác nhận và đổi `isPaid = true`.
  - **VNPay / Momo:** Backend gọi API nhà cung cấp lấy Payment URL -> Trả URL cho Client -> Hệ thống nhận Webhook (IPN) hoặc Return URL để tự động cập nhật trạng thái đơn.
- **Luồng Quản Lý Ảnh (Upload Flow):**
  - Client gửi `FormData` -> `Multer` parse file -> Controller đẩy file sang `Cloudinary` -> Lấy `secure_url` -> Lưu Mongoose.

## 5. 🚨 Các Vấn Đề (Anti-patterns) & Lộ trình Refactor bằng Design Patterns
Để backend dễ bảo trì, mở rộng và tuân thủ các nguyên tắc SOLID, lộ trình refactor sẽ áp dụng các nhóm Design Pattern (GoF) sau:

### 5.1. Creational Patterns (Mẫu Khởi tạo)
- **Factory Method / Simple Factory:** Thay vì nhồi nhét nhiều nhánh `if-else` trong Order Controller cho các phương thức thanh toán, ta sẽ dùng Factory để tạo ra đối tượng `PaymentProvider` tương ứng (Stripe, Momo, VNPay).
- **Singleton:** Chuẩn hóa lại các modules như Database Connection, Redis Cache, Cloudinary Config, và Logger để đảm bảo chỉ khởi tạo một instance duy nhất.
- **Builder Pattern:** Dùng để xây dựng các câu query filter phức tạp cho danh sách Product (như lọc theo khoảng giá, category, brand, search keyword).

### 5.2. Structural Patterns (Mẫu Cấu trúc)
- **Layered Architecture (3-Tier):** Thay thế Fat Controllers. Cấu trúc mới sẽ là: 
  `Route` -> `Controller` (I/O Handler) -> `Service` (Business Logic) -> `Repository` (Data Access).
- **Facade Pattern:** Gom nhóm các thao tác gọi API bên thứ ba (như `NodeMailer`, `Stripe`) vào một Facade đơn giản để ẩn đi độ phức tạp.
- **Proxy Pattern:** Tái sử dụng và chuẩn hóa Middleware (`auth.middleware.js`). Middleware hoạt động như Proxy chặn các request không hợp lệ trước khi chạm đến Controller.

### 5.3. Behavioral Patterns (Mẫu Hành vi)
- **Strategy Pattern:** Áp dụng cho logic thanh toán. Dù là VNPay, Momo hay Stripe, mỗi bên sẽ được đóng gói thành một Strategy implement các hàm chuẩn như `generatePaymentUrl()`, `verifyWebhook()`.
- **Observer Pattern (Pub/Sub):** Áp dụng bằng `EventEmitter`. Khi một Order được tạo thành công, phát ra sự kiện `order.created`. Các Observers sẽ lắng nghe để: Trừ Stock kho hàng, Xóa giỏ hàng, và Gửi Email thông báo (Decoupling hoàn toàn).
- **Centralized Error Handling:** Áp dụng Middleware gom lỗi tập trung (kết hợp `AppError` và `asyncHandler`) để loại bỏ hoàn toàn các khối `try/catch` lặp lại.

**Hướng thực hiện (Strangler Fig Pattern):**
1. Khởi tạo core (Error handling, Utility base).
2. Tách lớp Service cho module đơn giản (Cart, Review).
3. Triển khai Strategy + Factory cho module phức tạp nhất (Order & Payment).
4. Viết tính năng mới hoàn toàn dựa trên cấu trúc vừa thiết lập để không dính nợ kỹ thuật.
