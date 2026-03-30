# 📖 Hướng dẫn sử dụng — ABC Shop

## 📁 Cấu trúc file thay thế

```
output/
├── backend/
│   ├── Product.js              → thay backend/models/v2/Product.js
│   ├── product.controller.js   → thay backend/controllers/v2/product.controller.js
│   ├── productRoutes.js        → thay backend/routes/v2/productRoutes.js
│   ├── order.controller.js     → thay backend/controllers/v2/order.controller.js
│   ├── adminStats.controller.js→ thay backend/controllers/v2/adminStats.controller.js
│   ├── emailService.js         → TẠO MỚI backend/services/emailService.js
│   ├── marketing.controller.js → TẠO MỚI backend/controllers/v2/marketing.controller.js
│   ├── marketingRoutes.js      → TẠO MỚI backend/routes/v2/marketingRoutes.js
│   └── v2.js                   → thay backend/v2.js
├── frontend/
│   ├── ProductItem.jsx         → thay frontend/src/components/ProductItem.jsx
│   └── Collection.jsx          → thay frontend/src/pages/Collection.jsx
└── admin/
    ├── App.jsx                 → thay admin/src/App.jsx
    ├── SideBar.jsx             → thay admin/src/components/SideBar.jsx
    ├── Add.jsx                 → thay admin/src/pages/Add.jsx
    ├── Marketing.jsx           → TẠO MỚI admin/src/pages/Marketing.jsx
    └── Stats.jsx               → thay admin/src/pages/Stats.jsx
```

---

## 1️⃣ Cài đặt dependencies

### Backend
```bash
cd backend
npm install nodemailer xlsx
```

### Admin
```bash
cd admin
npm install xlsx
```

---

## 2️⃣ Biến môi trường `.env` (backend)

```env
# ... các biến cũ ...

# ✅ SMTP email (dùng Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password   # App Password (không phải mật khẩu Gmail thường)

# ✅ URL frontend (dùng trong email link)
FRONTEND_URL=http://localhost:5173
```

> **Lấy App Password Gmail:**
> Google Account → Security → 2-Step Verification → App passwords → Create

---

## 3️⃣ Thống kê doanh thu (Feature 1)

### Những gì đã sửa
- `adminStats.controller.js` giờ trả về **3 loại doanh thu**:
  - `revenue` — tổng từ tất cả đơn không hủy
  - `paidRevenue` — chỉ đơn `isPaid = true`
  - Doanh thu chờ thu = `revenue - paidRevenue`
- Thêm `statusCounts` — breakdown đơn theo 5 trạng thái
- `Stats.jsx` hiển thị đầy đủ các chỉ số này

### Cách đọc số liệu
| Chỉ số | Ý nghĩa |
|---|---|
| Doanh thu (tất cả đơn) | Tổng tiền từ đơn pending + confirmed + shipping + delivered |
| Đã thực thu | Chỉ đơn đã thanh toán (Stripe verified hoặc COD delivered) |
| Chờ thu | COD đang giao/chờ xác nhận |

---

## 4️⃣ Discount / Sale tự động (Feature 3)

### Schema mới (Product model)
```js
discount:    Number (0-100)   // % giảm giá
saleStartAt: Date | null      // bắt đầu sale
saleEndAt:   Date | null      // kết thúc sale
```

### Cách hoạt động
- `salePrice` là **virtual field** — tự động tính khi `discount > 0` và trong khoảng `saleStartAt–saleEndAt`
- Nếu không set `saleStartAt/saleEndAt`, discount áp dụng **ngay lập tức và vô thời hạn**
- Khi đặt hàng, `order.controller.js` dùng `salePrice` (đã giảm) để tính tổng đơn

### Thiết lập discount nhanh (Admin → Tiếp thị)
1. Vào **Admin Panel → Tiếp thị**
2. Chọn sản phẩm muốn sale (hoặc để trống = áp dụng tất cả)
3. Kéo slider chọn % giảm giá (5% → 90%)
4. Tùy chọn: đặt thời gian bắt đầu/kết thúc
5. Nhấn **"Áp dụng Discount"**

### Thiết lập discount khi thêm sản phẩm mới
Form "Thêm sản phẩm" có mục **"Thiết lập Discount"** với:
- Slider % giảm giá
- Preview giá sau giảm (real-time)
- Ngày bắt đầu/kết thúc sale

### Frontend hiển thị
- Badge đỏ `-X%` ở góc trên trái mỗi sản phẩm
- Giá gốc gạch ngang, giá sale màu indigo đậm
- Hiển thị trong trang `Collection`, `Product detail`, `Cart`

---

## 5️⃣ Nhập sản phẩm từ Excel (Feature 4)

### Định dạng file Excel
| Tên sản phẩm | Mô tả | Giá | Danh mục | Thương hiệu | Tồn kho | Giảm giá (%) | Ghi chú |
|---|---|---|---|---|---|---|---|
| iPhone 15 Pro | Flagship Apple | 29000000 | Điện thoại | Apple | 50 | 10 | Hàng chính hãng |
| AirPods Pro | Tai nghe không dây | 6000000 | Phụ kiện | Apple | 100 | 0 | |

### Cách sử dụng
1. **Admin Panel → Thêm sản phẩm → Tab "Nhập từ Excel"**
2. Nhấn **"Tải file mẫu Excel"** để lấy template
3. Điền thông tin vào file mẫu
4. Upload file → Hệ thống tự động import
5. Xem kết quả (số sản phẩm tạo thành công, lỗi nếu có)

### Lưu ý
- Ảnh không thể import qua Excel → Cập nhật sau qua trang chỉnh sửa sản phẩm
- Cột "Giảm giá (%)" không bắt buộc, mặc định 0
- Sản phẩm thiếu tên/giá/danh mục/thương hiệu sẽ bị bỏ qua

### API trực tiếp (nếu cần)
```bash
POST /api/v2/products/bulk-import
Authorization: Cookie token (admin)
Content-Type: application/json

{
  "products": [
    { "name": "...", "price": 500000, "category": "...", "brand": "...", "stock": 100, "discount": 10 }
  ]
}
```

---

## 6️⃣ Chiến lược tiếp thị — Email tự động (Feature 7)

### Gửi email khuyến mãi
**Admin Panel → Tiếp thị → Tab "Email Marketing"**

1. Nhập tiêu đề email
2. Nhập mã giảm giá (tuỳ chọn, VD: `SALE20`)
3. Chọn sản phẩm muốn giới thiệu trong email (hoặc để trống = lấy 6 sản phẩm đang sale)
4. Nhấn **"Gửi email đến tất cả khách hàng"**

### Email tự động khi đặt hàng
Email xác nhận đơn hàng được gửi ngay sau khi đặt thành công.

**Tích hợp vào `order.controller.js`:**
```js
// Thêm vào cuối placeOrder (sau khi tạo đơn thành công)
import { sendOrderConfirmation } from "../../services/emailService.js"

// Sau session.withTransaction:
const user = await User.findById(userId).select("name email")
await sendOrderConfirmation({
  to:         user.email,
  name:       user.name,
  orderId:    newOrderId,
  items:      lineItems,
  totalPrice: itemsPrice + shippingPrice,
}).catch(console.error) // Non-blocking
```

### API marketing (Admin only)
```bash
# Gửi email hàng loạt
POST /api/v2/marketing/send-promo
{ "subject": "Sale 50%!", "promoCode": "SALE50", "productIds": ["id1","id2"] }

# Áp dụng discount hàng loạt
POST /api/v2/marketing/bulk-discount
{ "productIds": ["id1"], "discount": 20, "saleStartAt": "2026-04-01", "saleEndAt": "2026-04-30" }

# Xóa discount
POST /api/v2/marketing/remove-discount
{ "productIds": ["id1","id2"] }
```

---

## 7️⃣ Fix lỗi Pagination (Feature 6)

### Vấn đề gốc
`useEffect` reset page dùng `setPage` trong deps array gây infinite loop, dẫn đến:
- Trang reset không đúng lúc
- Bấm trang 2 → tự nhảy về trang 1

### Giải pháp (trong `Collection.jsx`)
```js
// Dùng ref để track filter key cũ, chỉ reset khi key thực sự thay đổi
const prevKey = useRef('')
const filterKey = [category.join(','), brands.join(','), sortType, debouncedSearch, String(showSearch)].join('|')

useEffect(() => {
  if (prevKey.current === '') { prevKey.current = filterKey; return }
  if (prevKey.current !== filterKey) {
    prevKey.current = filterKey
    setPage(1)
  }
}, [filterKey]) // không có setPage trong deps
```

### Cải tiến UI pagination
- Hiển thị số trang với `…` cho khoảng cách lớn (VD: 1 … 4 5 6 … 20)
- Nút Trước/Sau có màu indigo khi active, xám khi disabled

---

## 8️⃣ UI/UX Refactor — Design System

### Màu sắc thống nhất
```css
--color-primary:    #4F46E5  (Indigo 600)
--color-accent:     #7C3AED  (Violet 600)
--color-bg:         #F5F4FF  (Indigo 50)
--color-nav:        #0F0E2A  (Dark navy)
--color-sidebar:    #1A1740  (Dark indigo)
--color-text:       #1E1B4B
--color-muted:      #9CA3AF
--color-border:     #DDD6FE
```

### Typography
- Font chính: **DM Sans** (sans-serif, body)
- Font display: **Playfair Display** (hero titles)

### Nguyên tắc
- **Không dùng nền trắng + chữ đen thuần** — mọi background đều có tông màu
- Card: `border: 1.5px solid #EDE9FE` + `background: #FFFFFF` (có tông tím nhạt)
- Nút chính: gradient `#4F46E5 → #7C3AED`
- Navbar: `#0F0E2A` (dark navy)
- Sidebar admin: `#1A1740` với active `#4F46E5`

---

## 9️⃣ Checklist triển khai

```
□ Copy tất cả file từ output/ vào đúng vị trí
□ cd backend && npm install nodemailer xlsx
□ cd admin && npm install xlsx
□ Thêm SMTP_USER, SMTP_PASS, FRONTEND_URL vào .env
□ Restart backend server
□ Test: Admin → Thống kê (kiểm tra doanh thu)
□ Test: Admin → Tiếp thị → Áp dụng 10% cho 1 sản phẩm
□ Test: Frontend → Collection → Kiểm tra badge -10% hiển thị
□ Test: Frontend → Collection → Phân trang (chuyển trang 2, filter không reset)
□ Test: Admin → Thêm sản phẩm → Tab Excel → Tải mẫu → Upload
□ Test: Admin → Tiếp thị → Email → Gửi thử (kiểm tra inbox)
```

---

## 🐛 Troubleshooting

### Email không gửi được
- Kiểm tra `SMTP_USER` và `SMTP_PASS` trong `.env`
- Gmail: phải bật **2-Step Verification** rồi mới tạo được App Password
- Thử với Mailtrap.io để test local: `SMTP_HOST=sandbox.smtp.mailtrap.io`

### Discount không hiển thị
- Kiểm tra `saleEndAt` — nếu đã qua thời gian kết thúc, discount không áp dụng
- Đảm bảo backend trả về field `salePrice` trong response `/api/v2/products`

### Excel import lỗi
- Kiểm tra header cột phải đúng chính xác (có dấu cách, dấu ngoặc)
- File phải là `.xlsx` hoặc `.xls`
- Tải lại file mẫu bằng nút "Tải file mẫu Excel"
