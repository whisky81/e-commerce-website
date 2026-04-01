# Guide 2 — Cải tiến & Bổ sung

## Tổng quan

Tài liệu này mô tả tất cả các thay đổi được thực hiện trong phiên cải tiến thứ 2 của dự án.

---

## 1. Thống nhất giá Discount trên toàn bộ giao diện

**Vấn đề:** `salePrice` từ backend không được truyền xuống các component hiển thị sản phẩm ở trang chủ, trang best-seller, trang related-products. Giá gốc luôn được hiển thị.

**Đã sửa:**
- `BestSeller.jsx` — truyền `salePrice`, `discount` vào `ProductItem`
- `LatestCollection.jsx` — truyền `salePrice`, `discount` vào `ProductItem`
- `RelatedProducts.jsx` — truyền `salePrice`, `discount` vào `ProductItem`
- `Product.jsx` (detail) — hiển thị giá sau giảm, badge %, số tiền tiết kiệm
- `ShopContext.jsx` — `addToCart` nhận thêm tham số `salePrice`, lưu `effectivePrice` vào giỏ
- `CartTotal.jsx` — sửa bug tính tổng (không cộng shipping khi giỏ rỗng)

**Kết quả:** Giá discount nhất quán từ trang chủ → trang sản phẩm → giỏ hàng → thanh toán.

---

## 2. Cải thiện styling Email marketing

**Vấn đề:** Template email promo có nền tối + chữ tối gây mờ, khó đọc.

**Đã sửa (`backend/services/emailService.js`):**
- Email marketing: nền sáng `#F8FAFC`, chữ tối `#111827` → tương phản cao
- Header gradient xanh/tím đẹp, chữ trắng rõ
- Sản phẩm: card nền trắng, bo góc, shadow nhẹ
- Giá gốc gạch ngang màu xám, giá sale màu xanh đậm
- Badge giảm giá nổi bật đỏ
- Promo code: viền dashed tím, font monospace lớn
- Email xác nhận đơn hàng: bảng sản phẩm border-bottom rõ ràng

---

## 3. Xác nhận Email (Email Verification)

### Backend
**File mới/sửa:**
- `backend/models/v2/User.js` — thêm fields: `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires`
- `backend/services/emailService.js` — thêm `sendVerificationEmail()`
- `backend/controllers/v2/auth.controller.js` — thêm `verifyEmail`, `resendVerification`; cập nhật `register` để gửi email sau đăng ký
- `backend/routes/v2/authRoutes.js` — thêm routes:
  - `GET /api/v2/auth/verify-email?token=<token>`
  - `POST /api/v2/auth/resend-verification` (cần đăng nhập)

**Logic:**
- Đăng ký → tạo token SHA-256, lưu hashed vào DB, gửi email link 24 giờ
- Click link → verify token → set `isEmailVerified = true`, xóa token
- Nếu link hết hạn → gọi resend → tạo token mới gửi lại

### Frontend
**Files mới:**
- `frontend/src/pages/VerifyEmail.jsx` — trang xử lý click link, hiển thị kết quả (loading/success/error)
- `frontend/src/components/EmailVerificationBanner.jsx` — banner cảnh báo email chưa xác nhận + nút gửi lại

**Cập nhật:**
- `frontend/src/App.jsx` — route `/verify-email` + `<EmailVerificationBanner />`
- `frontend/src/context/ShopContext.jsx` — `user.isEmailVerified` được load từ API `/profile`

### Kiểm soát mua sắm
- `backend/controllers/v2/order.controller.js` — `placeOrder` và `placeOrderStripe` kiểm tra `isEmailVerified`; trả về `code: "EMAIL_NOT_VERIFIED"` nếu chưa xác nhận
- `frontend/src/pages/PlayOrder.jsx` — bắt `code === 'EMAIL_NOT_VERIFIED'` và hiển thị thông báo rõ ràng

---

## 4. Google Maps – Chọn địa chỉ

**File mới: `frontend/src/components/MapAddressPicker.jsx`**

**Tính năng:**
- Tích hợp Google Maps JavaScript API + Places Autocomplete
- Tìm kiếm địa chỉ bằng thanh search → tự động điền form
- Nhấp vào bản đồ → Reverse Geocoding → điền form
- Lưu `lat`, `lng`, `placeId` vào địa chỉ user
- Graceful fallback nếu không có API key

**Tích hợp:**
- `PlayOrder.jsx` — nút "Chọn vị trí trên Google Maps" trong popup thêm địa chỉ
- `backend/models/v2/User.js` — address schema thêm `lat`, `lng`, `placeId`
- `backend/controllers/v2/user.controller.js` — `addAddress`, `updateAddress` lưu tọa độ

**Cấu hình:**
```env
# frontend/.env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```
→ Tạo key tại: https://console.cloud.google.com → Enable "Maps JavaScript API" + "Places API"

**Link xem vị trí giao hàng:**  
Trong popup chọn địa chỉ và trang đặt hàng, địa chỉ có GPS sẽ hiện link "📍 Xem trên Google Maps"

---

## 5. Bug fixes & Cải tiến

| Bug | File | Sửa |
|-----|------|-----|
| `cartAmount()` cộng shipping khi giỏ rỗng | `CartTotal.jsx` | Chỉ cộng khi `subtotal > 0` |
| `BestSeller` sắp xếp sai (không theo `soldCount`) | `BestSeller.jsx` | Sort theo `soldCount` desc |
| `addToCart` không dùng `salePrice` → giá giỏ hàng sai | `ShopContext.jsx` | Nhận `salePrice`, dùng `effectivePrice` |
| Màu sắc email promo không tương phản | `emailService.js` | Redesign toàn bộ template |
| Không có route `/verify-email` | `App.jsx` | Thêm route |
| Address model thiếu fields GPS | `User.js` | Thêm `lat`, `lng`, `placeId` |

---

## 6. Cấu trúc file thay đổi

```
backend/
  models/v2/User.js                    ← thêm isEmailVerified, GPS fields
  controllers/v2/auth.controller.js    ← verifyEmail, resendVerification
  controllers/v2/user.controller.js    ← lưu lat/lng/placeId
  controllers/v2/order.controller.js   ← kiểm tra isEmailVerified
  routes/v2/authRoutes.js              ← route verify-email, resend-verification
  services/emailService.js             ← sendVerificationEmail, redesign promo

frontend/src/
  App.jsx                              ← route /verify-email, EmailVerificationBanner
  context/ShopContext.jsx              ← addToCart nhận salePrice, isEmailVerified
  components/
    BestSeller.jsx                     ← pass salePrice/discount
    LatestCollection.jsx               ← pass salePrice/discount
    RelatedProducts.jsx                ← pass salePrice/discount
    CartTotal.jsx                      ← fix shipping bug
    EmailVerificationBanner.jsx        ← NEW
    MapAddressPicker.jsx               ← NEW
  pages/
    Product.jsx                        ← hiển thị discount đúng, addToCart với salePrice
    PlayOrder.jsx                      ← Maps popup, email check
    VerifyEmail.jsx                    ← NEW
```

---

## 7. Biến môi trường cần thêm

```env
# backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_GOOGLE_MAPS_API_KEY=AIza...      ← Cho tính năng bản đồ
```

---

## Checklist triển khai

- [ ] Chạy `npm install` ở backend (đảm bảo `nodemailer`, `bcryptjs`, `crypto` có sẵn)
- [ ] Cấu hình SMTP (Gmail: bật 2FA → tạo App Password)
- [ ] Tạo Google Maps API key, enable Maps JS API + Places API
- [ ] Thêm `VITE_GOOGLE_MAPS_API_KEY` vào `frontend/.env`
- [ ] Restart server sau khi thêm biến môi trường
- [ ] Test đăng ký → nhận email → click link → xác nhận thành công
- [ ] Test đặt hàng khi chưa xác nhận email → nhận lỗi rõ ràng
