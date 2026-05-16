# ABC Shop API Documentation v3

> **Base URL:** `http://localhost:5000`  
> **Last updated:** 2026-05-14  
> **Version:** v3 (supersedes & extends v2)

---

## Table of Contents

- [1. Conventions](#1-conventions)
- [2. Authentication & Authorization](#2-authentication--authorization)
- [3. Response Format](#3-response-format)
- [4. Pagination Format](#4-pagination-format)
- [5. Error Codes Reference](#5-error-codes-reference)
- [6. Auth Endpoints](#6-auth-endpoints)
- [7. User Endpoints](#7-user-endpoints)
- [8. Product Endpoints](#8-product-endpoints)
- [9. Cart Endpoints](#9-cart-endpoints)
- [10. Review Endpoints](#10-review-endpoints)
- [11. Order Endpoints (v2)](#11-order-endpoints-v2)
- [12. Order Endpoints (v3)](#12-order-endpoints-v3)
- [13. Address Endpoints (v3)](#13-address-endpoints-v3)
- [14. Admin Endpoints](#14-admin-endpoints)
- [15. Admin Endpoints (v3)](#15-admin-endpoints-v3)
- [16. Settings Endpoints](#16-settings-endpoints)
- [17. Marketing Endpoints](#17-marketing-endpoints)
- [18. Subscriber Endpoints](#18-subscriber-endpoints)

---

## 1. Conventions

### 1.1 HTTP Status Codes

| Code  | Meaning                                          |
|-------|--------------------------------------------------|
| 200   | Success (GET, PUT, PATCH)                        |
| 201   | Created (POST)                                   |
| 204   | No Content (successful DELETE — body is empty)   |
| 400   | Bad Request — client error (validation, logic)   |
| 401   | Unauthorized — missing or invalid token          |
| 403   | Forbidden — insufficient permissions             |
| 404   | Not Found — resource does not exist              |
| 500   | Internal Server Error                             |

### 1.2 Field Naming

- All JSON keys use **camelCase** (`shippingAddress`, `isEmailVerified`)
- MongoDB `_id` fields are preserved as `_id` (string)
- Timestamps: ISO 8601 strings (e.g. `"2026-05-14T04:38:51.473Z"`)

### 1.3 Deprecation Notes

- `POST /api/orders/place` → **deprecated**, use `POST /api/v3/orders/cod/create`
- `POST /api/orders/stripe` → **deprecated**, use `POST /api/v3/orders/stripe/create`
- `POST /api/users/addresses` → **deprecated**, use `POST /api/v3/addresses/3-level/user`
- `GET /api/orders` (admin) → **deprecated**, use `GET /api/v3/admin/orders`
- `GET /api/admin/orders` → removed, use `GET /api/v3/admin/orders`

---

## 2. Authentication & Authorization

All protected endpoints require a **JWT token** sent as an **httpOnly cookie** named `token`.

### 2.1 Cookie Details

```
Name:     token
HttpOnly: true
SameSite: lax
Secure:   false (true in production)
Max-Age:  7 days
```

### 2.2 Permission Levels

| Icon | Meaning                        |
|------|--------------------------------|
| 🔓   | Public — no authentication     |
| 🔒   | User — valid JWT required      |
| 🛡️   | Admin — `role === "admin"`     |

### 2.3 Inactive / Unverified Accounts

- Inactive accounts (`isActive: false`) receive **400** with `errorCode: "NON_EXISTENT_ACCOUNT"` on any protected request.
- Unverified email blocks **order placement** (403, `errorCode: "EMAIL_NOT_VERIFIED"`); profile access is unaffected.

---

## 3. Response Format

### 3.1 Success Envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { … },
  "meta": { … } | null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field        | Type                 | Description                                      |
|--------------|----------------------|--------------------------------------------------|
| `success`    | `boolean`            | Always `true` for 2xx responses                  |
| `statusCode` | `number`             | HTTP status code                                 |
| `message`    | `string`             | Human-readable description                       |
| `data`       | `object` / `array` / `null` | Payload; `null` when no data            |
| `meta`       | `object` / `null`    | Pagination or extra metadata (see §4)            |
| `timestamp`  | `string` (ISO 8601)  | Server response time                             |

### 3.2 Error Envelope

```json
{
  "success": false,
  "errorCode": "SOME_CODE",
  "message": "Human-readable error message"
}
```

| Field       | Type      | Description                                   |
|-------------|-----------|-----------------------------------------------|
| `success`   | `boolean` | Always `false` for 4xx/5xx                    |
| `errorCode` | `string`  | Machine-readable code (see §5)                |
| `message`   | `string`  | Human-readable description                    |

> **Note:** Error responses do **not** include `statusCode` in the JSON body. The HTTP status code is sent as the response status line. This differs from success responses, which embed `statusCode` in the body.

---

## 4. Pagination Format

Paginated endpoints return `meta` with:

```json
{
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

| Field        | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| `page`       | `number`  | Current page (1-based)               |
| `limit`      | `number`  | Items per page                       |
| `total`      | `number`  | Total items matching the filter      |
| `totalPages` | `number`  | Ceil(total / limit)                  |
| `hasNext`    | `boolean` | `true` if page < totalPages          |
| `hasPrev`    | `boolean` | `true` if page > 1                   |

**Query parameters** (all paginated endpoints):

| Param   | Type     | Default | Max   | Description        |
|---------|----------|---------|-------|--------------------|
| `page`  | `number` | `1`     | —     | Page number        |
| `limit` | `number` | `12`    | `100` | Items per page     |

---

## 5. Error Codes Reference

| errorCode                    | HTTP | Meaning                                              |
|------------------------------|------|------------------------------------------------------|
| `MISSING_EMAIL_OR_PASSWORD`  | 400  | Login body missing email or password                 |
| `INCORRECT_PASSWORD`         | 400  | Wrong password                                       |
| `DUPLICATE_EMAIL`            | 400  | Email already registered                             |
| `INVALID_TOKEN`              | 400  | Malformed or already-used verification token         |
| `NON_EXISTENT_ACCOUNT`       | 400  | Account deactivated (`isActive: false`)              |
| `NOTHING_TO_UPDATE`          | 400  | Update payload identical to existing values          |
| `MISSING_ADDRESS_FIELDS`     | 400  | Required address fields missing                      |
| `BAD_REQUEST`                | 400  | Invalid request body (e.g. missing array)            |
| `INVALID_IDS`                | 400  | Array of ObjectIds contains invalid entries          |
| `EMPTY_CART`                 | 400  | Cart is empty at checkout                            |
| `OUT_OF_STOCK`               | 400  | Requested quantity exceeds stock                     |
| `INSUFFICIENT_STOCK`         | 400  | Stock decreased below 0 during transaction           |
| `INVALID_PRODUCT`            | 400  | Product ID does not exist                            |
| `STRIPE_PAYMENT_FAILED`      | 400  | Stripe checkout cancelled or failed                  |
| `MOMO_PAYMENT_FAILED`        | 400  | MoMo gateway rejected the request                    |
| `EMAIL_NOT_VERIFIED`         | 403  | User must verify email before placing orders         |
| `EMPTY_MESSAGE`              | 400  | Contact support message is empty                     |
| `NOT_FOUND`                  | 404  | Generic resource not found                           |
| `UNAUTHORIZED`               | 401  | Missing or invalid JWT cookie                        |
| `FORBIDDEN`                  | 403  | User lacks admin privileges                          |
| `VALIDATION_ERROR`           | 400  | Mongoose or custom validation failed                 |
| `INVALID_FORMAT`             | 400  | Invalid parameter format (e.g. non-ObjectId)         |
| `DUPLICATE_KEY`              | 400  | Unique constraint violation (Mongoose error 11000)   |
| `IMAGE_IS_REQUIRED`          | 400  | Banner upload missing image file                     |
| `INVALID_EMAIL`              | 400  | Invalid email format in subscriber/unsubscribe       |
| `ESTIMATE_DELIVERY_TIME`     | 500  | GHN delivery-time API call failed                    |
| `CALC_SHIPPING_FEE`          | 500  | GHN shipping-fee API call failed                     |
| `INVALID_TOKEN` (JWT)        | 401  | JWT signature verification failed                    |
| `TOKEN_EXPIRED`              | 401  | JWT has expired                                      |
| `INTERNAL_SERVER_ERROR`      | 500  | Unhandled / programmer error                         |

---

## 6. Auth Endpoints

Base path: `/api/auth`

---

### 6.1 Register

```
POST /api/auth/register  🔓
```

**Request Body**

```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 characters)"
}
```

**Success Response** `201`

```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "data": {
    "id": "6a0489a70cdff9cd32a96b47",
    "role": "user",
    "redirectUrl": "http://localhost:5173"
  }
}
```

> **Note:** Sets `token` cookie. A verification email is sent. A `Subscriber` record is created with `isActive: false` (opted-out by default).

**Error Responses**

| Status | errorCode               | Condition                     |
|--------|--------------------------|-------------------------------|
| 400    | `DUPLICATE_EMAIL`        | Email already exists          |
| 400    | —                        | Missing `name`, `email`, or `password` |
| 400    | —                        | Invalid email format          |

---

### 6.2 Login

```
POST /api/auth/login  🔓
```

**Request Body**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response** `200`

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "id": "6a0489a70cdff9cd32a96b47",
    "role": "user",
    "redirectUrl": "http://localhost:5173"
  }
}
```

| Status | errorCode                  | Condition              |
|--------|----------------------------|------------------------|
| 404    | —                          | User does not exist    |
| 400    | `INCORRECT_PASSWORD`       | Wrong password         |
| 400    | `MISSING_EMAIL_OR_PASSWORD`| Missing fields         |

---

### 6.3 Logout

```
POST /api/auth/logout  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Clears the `token` cookie by setting `expires` to epoch.

---

### 6.4 Verify Email

```
GET /api/auth/verify-email?token=<rawToken>  🔓
```

**Query Parameters**

| Param   | Type     | Required | Description                               |
|---------|----------|----------|-------------------------------------------|
| `token` | `string` | Yes      | Raw verification token from email link    |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Verified successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode      | Condition                              |
|--------|----------------|----------------------------------------|
| 400    | `INVALID_TOKEN`| Token invalid, already used, or malformed |
| 400    | —              | Token expired (> 24 hours)             |

---

### 6.5 Resend Verification Email

```
POST /api/auth/resend-verification  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition                           |
|--------|-----------|-------------------------------------|
| 400    | —         | Email is already verified           |
| 500    | —         | SMTP send failed                    |

---

### 6.6 Google OAuth

```
GET /api/auth/google          🔓   → redirect to Google
GET /api/auth/google/callback 🔓   ← Google redirects here
```

- `GET /api/auth/google` — initiates OAuth flow.
- `GET /api/auth/google/callback` — Google redirects back.
  - **Success:** sets `token` cookie → redirects to `FRONTEND_URL/?auth=success`
  - **Failure:** redirects to `FRONTEND_URL/login?error=google`

---

### 6.7 Facebook OAuth

```
GET /api/auth/facebook          🔓   → redirect to Facebook
GET /api/auth/facebook/callback 🔓   ← Facebook redirects here
```

- Same flow as Google: success redirects to `FRONTEND_URL/?auth=success`, failure to `FRONTEND_URL/login?error=facebook`

---

## 7. User Endpoints

Base path: `/api/users`  
All endpoints require 🔒

---

### 7.1 Get Profile

```
GET /api/users/profile  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "name": "anh",
    "email": "anh6whisky81@gmail.com",
    "role": "user",
    "avatar": {
      "url": "https://res.cloudinary.com/…/avatar.jpg",
      "publicId": "avatars/abc123"
    },
    "addresses": [
      {
        "_id": "6a04f…",
        "fullName": "anh6q",
        "phone": "0377300999",
        "street": "Số 12",
        "ward": "Thị Trấn Si Ma Cai",
        "province": "Lào Cai",
        "isDefault": true,
        "lat": null,
        "lng": null,
        "placeId": null,
        "district": "Huyện Si Ma Cai",
        "wardCode": "90816",
        "districtId": 2264,
        "provinceId": 269,
        "createdAt": "2026-05-14T02:00:00.000Z",
        "updatedAt": "2026-05-14T02:00:00.000Z"
      }
    ],
    "favorites": ["6a04c15667914f2a821e414b"],
    "isEmailVerified": true,
    "cart": [
      {
        "product": "6a04c15667914f2a821e414b",
        "quantity": 2
      }
    ],
    "estimatedDeliveryTime": null,
    "createdAt": "2026-05-14T02:00:00.000Z",
    "updatedAt": "2026-05-14T02:00:00.000Z"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field                   | Type                | Nullable | Description                                          |
|-------------------------|---------------------|----------|------------------------------------------------------|
| `avatar`                | `object` / `null`   | Yes      | `{ url, publicId }`                                  |
| `addresses[].district`  | `string`            | Yes      | Only populated via v3 address API                    |
| `addresses[].wardCode`  | `string`            | Yes      | GHN ward code, for shipping                          |
| `addresses[].districtId`| `number`            | Yes      | GHN district ID                                      |
| `addresses[].provinceId`| `number`            | Yes      | GHN province ID                                      |
| `addresses[].lat`       | `number` / `null`   | Yes      | GPS latitude                                         |
| `addresses[].lng`       | `number` / `null`   | Yes      | GPS longitude                                        |
| `addresses[].placeId`   | `string` / `null`   | Yes      | Google Maps Place ID                                 |
| `favorites`             | `string[]`          | No       | Array of Product `_id`                               |
| `estimatedDeliveryTime` | `string` / `null`   | Yes      | ISO 8601, estimated for default address              |

---

### 7.2 Update Profile

```
PUT /api/users/profile  🔒
```

**Request Body**

```json
{
  "name": "string (optional, trimmed)",
  "email": "string (optional, valid email)"
}
```

> At least one field must differ from the current value, otherwise `NOTHING_TO_UPDATE`.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated",
  "data": {
    "name": "anhmới",
    "email": "anh6whisky81@gmail.com",
    "isEmailVerified": true,
    "favorites": [],
    "cart": [],
    "addresses": [ … ],
    "createdAt": "2026-05-14T02:00:00.000Z",
    "updatedAt": "2026-05-14T14:30:00.000Z",
    "avatar": { "url": "…", "publicId": "…" }
  },
  "meta": null,
  "timestamp": "2026-05-14T14:30:00.244Z"
}
```

| Status | errorCode           | Condition                         |
|--------|---------------------|-----------------------------------|
| 400    | `NOTHING_TO_UPDATE` | No actual change                  |
| 400    | `DUPLICATE_EMAIL`   | Email already belongs to another user |
| 400    | —                   | Invalid email format              |

---

### 7.3 Upload Avatar

```
POST /api/users/avatar  🔒
Content-Type: multipart/form-data
```

**Form Data**

| Field    | Type   | Required | Description          |
|----------|--------|----------|----------------------|
| `avatar` | `file` | Yes      | Single image file    |

- Auto-resized to 200×200 (face gravity), auto quality/format.
- Deletes previous Cloudinary image if exists.

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Updated successfully",
  "data": {
    "url": "https://res.cloudinary.com/…/avatar.jpg",
    "publicId": "avatars/abc123"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition                  |
|--------|-----------|----------------------------|
| 404    | —         | No file uploaded           |
| 500    | `SERVER_ERROR` | Cloudinary delete failed |

---

### 7.4 List Favorites

```
GET /api/users/favorites  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "_id": "6a0489a70cdff9cd32a96b47",
    "favorites": [
      {
        "_id": "6a04c15667914f2a821e414b",
        "name": "test name",
        "price": 100000,
        "salePrice": 100000,
        "images": [ … ],
        "category": "dien-thoai",
        "brand": "apple",
        "stock": 100,
        "soldCount": 5,
        "discount": 0,
        "saleStartAt": null,
        "saleEndAt": null
      }
    ]
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 7.5 Add Favorite

```
POST /api/users/favorites/:productId  🔒
```

**Path Parameters**

| Param       | Type     | Required | Description  |
|-------------|----------|----------|--------------|
| `productId` | `string` | Yes      | Valid MongoDB ObjectId of a Product |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Idempotent — uses `$addToSet`, duplicate additions are ignored.

| Status | errorCode | Condition             |
|--------|-----------|-----------------------|
| 400    | —         | Invalid `productId`   |
| 404    | —         | Product not found     |

---

### 7.6 Remove Favorite

```
DELETE /api/users/favorites/:productId  🔒
```

**Path Parameters**

| Param       | Type     | Required | Description  |
|-------------|----------|----------|--------------|
| `productId` | `string` | Yes      | Valid MongoDB ObjectId of a Product |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 7.7 Add Address (v2)

```
POST /api/users/addresses  🔒
```

> ⚠️ **Deprecated** — prefer `POST /api/v3/addresses/3-level/user` (see §13.4) which includes `wardCode`, `districtId`, `provinceId` for shipping.

**Request Body**

```json
{
  "fullName": "string (required)",
  "phone": "string (required, Vietnamese format: 0[3|5|7|8|9]XXXXXXXX)",
  "street": "string (required, max 255)",
  "ward": "string (required)",
  "province": "string (required)",
  "isDefault": "boolean (optional, default: false)",
  "lat": "number | null (optional)",
  "lng": "number | null (optional)",
  "placeId": "string | null (optional)"
}
```

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Address added successfully",
  "data": {
    "_id": "6a04f…",
    "fullName": "anh6q",
    "phone": "0377300999",
    "street": "Số 12",
    "ward": "Thị Trấn Si Ma Cai",
    "province": "Lào Cai",
    "isDefault": false,
    "lat": null,
    "lng": null,
    "placeId": null,
    "createdAt": "2026-05-14T02:00:00.000Z",
    "updatedAt": "2026-05-14T02:00:00.000Z"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> When `isDefault: true`, all other addresses are set to `isDefault: false`.

---

### 7.8 Update Address (v2)

```
PUT /api/users/addresses/:addressId  🔒
```

**Path Parameters**

| Param       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `addressId` | `string` | MongoDB ObjectId of the user's address   |

**Request Body**

Same fields as §7.7. All fields required (the operation is a full replacement).

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { … },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 7.9 Bulk Delete Addresses

```
DELETE /api/users/addresses  🔒
```

**Request Body**

```json
{
  "bulk": ["6a04f…", "6a04f…"]
}
```

| Field  | Type       | Required | Description                       |
|--------|------------|----------|-----------------------------------|
| `bulk` | `string[]` | Yes      | Array of address ObjectIds        |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Addresses deleted successfully",
  "data": [ … ],
  "meta": {
    "deletedAddressesCount": 2
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> `data` contains the remaining addresses after deletion.

---

## 8. Product Endpoints

Base path: `/api/products`

---

### 8.1 List Products

```
GET /api/products  🔓
```

**Query Parameters**

| Param        | Type     | Default | Description                                          |
|--------------|----------|---------|------------------------------------------------------|
| `page`       | `number` | `1`     | Page number                                          |
| `limit`      | `number` | `12`    | Items per page (max 100)                             |
| `category`   | `string` | —       | Single category filter                               |
| `categories` | `string` | —       | Comma-separated list (e.g. `dien-thoai,laptop`)     |
| `brand`      | `string` | —       | Single brand filter                                  |
| `brands`     | `string` | —       | Comma-separated list                                 |
| `minPrice`   | `number` | —       | Minimum price (inclusive)                            |
| `maxPrice`   | `number` | —       | Maximum price (inclusive)                            |
| `sort`       | `string` | —       | `price` (asc) or `-price` (desc)                     |
| `search`     | `string` | —       | Full-text search (uses MongoDB `$text` index)        |
| `q`          | `string` | —       | Alias for `search`                                   |

> **Text search** uses MongoDB `$text` index on the `Product` collection. `search` and `q` are equivalent; `q` takes precedence.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a04c15667914f2a821e414b",
      "name": "iPhone 16 Pro Max",
      "price": 34990000,
      "salePrice": 31490000,
      "images": [
        {
          "url": "https://res.cloudinary.com/…/img1.jpg",
          "publicId": "products/abc123"
        }
      ],
      "category": "dien-thoai",
      "brand": "apple",
      "stock": 100,
      "soldCount": 47,
      "discount": 10,
      "saleStartAt": "2026-05-01T00:00:00.000Z",
      "saleEndAt": "2026-05-31T23:59:59.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false,
    "filters": {
      "categories": ["dien-thoai", "laptop", "phu-kien"],
      "brands": ["apple", "samsung", "xiaomi"]
    },
    "banner": {
      "name": "Summer Sale",
      "url": "https://res.cloudinary.com/…/banner.jpg"
    }
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field                       | Type                   | Nullable | Description                                      |
|-----------------------------|------------------------|----------|--------------------------------------------------|
| `salePrice`                 | `number`               | No       | Virtual: price after discount (if active period) |
| `discount`                  | `number`               | No       | 0-100, percentage                                |
| `saleStartAt` / `saleEndAt` | `string` (ISO) / `null`| Yes      | Discount time window                              |
| `meta.filters`              | `object`               | No       | Available categories & brands for UI filtering   |
| `meta.banner`               | `object` / `null`      | Yes      | Active banner (`name`, `url`)                    |

---

### 8.2 Get Product Detail

```
GET /api/products/:productId  🔓
```

**Path Parameters**

| Param       | Type     | Description        |
|-------------|----------|--------------------|
| `productId` | `string` | Product ObjectId   |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "product": {
      "_id": "6a04c15667914f2a821e414b",
      "name": "iPhone 16 Pro Max",
      "description": "Flagship Apple 2025",
      "price": 34990000,
      "salePrice": 31490000,
      "images": [
        { "url": "https://res.cloudinary.com/…/img1.jpg", "publicId": "products/abc" }
      ],
      "category": "dien-thoai",
      "brand": "apple",
      "specifications": [
        { "key": "Màn hình", "value": "6.9 inch OLED" },
        { "key": "RAM", "value": "8 GB" }
      ],
      "note": "Hàng chính hãng VN/A",
      "stock": 100,
      "soldCount": 47,
      "discount": 10,
      "saleStartAt": "2026-05-01T00:00:00.000Z",
      "saleEndAt": "2026-05-31T23:59:59.000Z"
    },
    "reviews": [
      {
        "_id": "6a05…",
        "user": {
          "_id": "6a04…",
          "name": "anh",
          "avatar": { "url": "…", "publicId": "…" }
        },
        "rating": 5,
        "comment": "Sản phẩm tuyệt vời!",
        "media": [
          { "url": "https://res.cloudinary.com/…/review1.jpg", "type": "image" }
        ],
        "createdAt": "2026-05-14T04:00:00.000Z"
      }
    ]
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Reviews with `isHidden: true` are excluded. Reviews from **inactive users** (`isActive: false`) are filtered out on the server.

| Status | errorCode | Condition         |
|--------|-----------|-------------------|
| 404    | —         | Product not found |

---

### 8.3 Bulk Import Products

```
POST /api/products/bulk-import  🔒🛡️
```

**Request Body**

```json
{
  "products": [
    {
      "name": "string (required)",
      "description": "string (required)",
      "price": 100000,
      "category": "string (required)",
      "brand": "string (required)",
      "note": "string (optional)",
      "specifications": [
        { "key": "Weight", "value": "200" }
      ],
      "stock": 100,
      "discount": 0,
      "images": [
        { "url": "https://example.com/img.jpg", "publicId": "imported" }
      ]
    }
  ]
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Imported 5 products",
  "data": {
    "created": 5,
    "skipped": 0,
    "errors": []
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode     | Condition            |
|--------|---------------|----------------------|
| 400    | —             | Empty products array |

---

## 9. Cart Endpoints

Base path: `/api/cart`  
All endpoints require 🔒

---

### 9.1 Get Cart

```
GET /api/cart  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "product": {
        "_id": "6a04c15667914f2a821e414b",
        "name": "iPhone 16 Pro Max",
        "price": 34990000,
        "salePrice": 31490000,
        "images": [ … ],
        "discount": 10,
        "saleStartAt": "2026-05-01T00:00:00.000Z",
        "saleEndAt": "2026-05-31T23:59:59.000Z"
      },
      "quantity": 2
    }
  ],
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 9.2 Add to Cart / Update Quantity

```
POST /api/cart  🔒
```

**Request Body**

```json
{
  "productId": "string (required, valid ObjectId)",
  "quantity": 3
}
```

> If the product already exists in the cart, the quantity is **replaced** (not incremented).

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart updated successfully",
  "data": [
    { "product": "6a04c15667914f2a821e414b", "quantity": 3 }
  ],
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition                        |
|--------|-----------|----------------------------------|
| 400    | —         | Missing `productId` or `quantity ≤ 0` |

---

### 9.3 Remove from Cart

```
DELETE /api/cart/:productId  🔒
```

**Path Parameters**

| Param       | Type     | Description       |
|-------------|----------|-------------------|
| `productId` | `string` | Product ObjectId  |

**Success Response** `204` — empty body.

| Status | errorCode | Condition              |
|--------|-----------|------------------------|
| 404    | —         | Product not in cart    |

---

## 10. Review Endpoints

Base path: `/api/reviews`  
All endpoints require 🔒

---

### 10.1 Create Review

```
POST /api/reviews  🔒
Content-Type: multipart/form-data
```

**Form Data**

| Field       | Type                | Required | Description                      |
|-------------|---------------------|----------|----------------------------------|
| `productId` | `string`            | Yes      | Product ObjectId                 |
| `rating`    | `number` (1-5)      | Yes      | Integer or numeric string        |
| `comment`   | `string`            | No       | Review text                      |
| `media1`    | `file`              | No       | Image or video (max 1)           |
| `media2`    | `file`              | No       | Image or video (max 1)           |

> Media files are uploaded to Cloudinary. Auto-detected as `image` or `video` based on MIME type.

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Created successfully",
  "data": {
    "_id": "6a05…",
    "user": "6a04…",
    "product": "6a04c…",
    "rating": 5,
    "comment": "Sản phẩm tuyệt vời!",
    "media": [
      { "url": "https://res.cloudinary.com/…/review1.jpg", "type": "image" }
    ],
    "isHidden": false,
    "createdAt": "2026-05-14T14:14:30.244Z",
    "updatedAt": "2026-05-14T14:14:30.244Z"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition              |
|--------|-----------|------------------------|
| 400    | —         | Missing `productId` or `rating` |
| 400    | —         | `rating` not between 1-5 |
| 404    | —         | Product not found      |

> Unique index on `(user, product)` — duplicate review attempts throw a 409 (`DUPLICATE_KEY`).

---

### 10.2 Update Review

```
PATCH /api/reviews/:reviewId  🔒
```

**Path Parameters**

| Param      | Type     | Description     |
|------------|----------|-----------------|
| `reviewId` | `string` | Review ObjectId |

**Request Body**

```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

> Both `rating` and `comment` are required.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { … },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Only the review author can update their own review (`user` must match).

| Status | errorCode | Condition                          |
|--------|-----------|------------------------------------|
| 400    | —         | Missing `rating` or `comment`      |
| 400    | —         | Invalid rating                     |
| 404    | —         | Review not found (or not owned)    |

---

## 11. Order Endpoints (v2)

Base path: `/api/orders`

---

### 11.1 Place Order — MoMo

```
POST /api/orders/momo  🔒
```

**Request Body**

```json
{
  "addressId": "string (required, valid MongoDB ObjectId)",
  "orderItems": [
    { "product": "string (required)", "quantity": 2 }
  ]
}
```

| Field        | Type       | Required | Description                                           |
|--------------|------------|----------|-------------------------------------------------------|
| `addressId`  | `string`   | Yes      | ObjectId from `req.user.addresses`                    |
| `orderItems` | `object[]` | No       | Items to order; if omitted, the **entire cart** is used |

> ⚠️ Uses a flat shipping price of 20,000 VND (static, no GHN).  
> Email verification is enforced (`EMAIL_NOT_VERIFIED`).

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "MoMo payment initiated",
  "data": {
    "payUrl": "https://test-payment.momo.vn/…",
    "orderId": "6a0531255f86810ffc27ba80"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> The client must redirect the user to `payUrl`. After payment, MoMo redirects to `{origin}/verify?method=momo&orderId={orderId}`.

---

### 11.2 Place Order — VNPay

```
POST /api/orders/vnpay  🔒
```

**Request Body** — same as §11.1.

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "VNPay payment initiated",
  "data": {
    "payUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?…",
    "orderId": "6a0531255f86810ffc27ba80"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> VNPay redirects to `{origin}/verify?method=vnpay&orderId={orderId}`. Expires in 15 minutes.

---

### 11.3 Verify Stripe Payment

```
POST /api/orders/verify-stripe  🔒
```

**Request Body**

```json
{
  "orderId": "string (required)",
  "success": true
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment verified successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> On success, sets `payment.status = "paid"` and decrements stock.

---

### 11.4 MoMo IPN (Webhook)

```
POST /api/orders/momo-ipn  🔓 (server-to-server)
```

> Called by MoMo server. Signature is verified. On `resultCode === 0`, sets `payment.status = "paid"` and decrements stock.  
> **Do NOT call this from the frontend.**

---

### 11.5 VNPay Return

```
GET /api/orders/vnpay-return?…  🔓
```

> Called by VNPay redirect. Signature is verified. On success, sets `payment.status = "paid"`.

**Success Response** `200`

```json
{
  "success": true,
  "message": "Payment successful"
}
```

**Error Response** `400`

```json
{
  "success": false,
  "message": "Payment verification failed"
}
```

---

### 11.6 Cancel Order

```
PATCH /api/orders/:orderId/cancel  🔒
```

**Path Parameters**

| Param     | Type     | Description     |
|-----------|----------|-----------------|
| `orderId` | `string` | Order ObjectId  |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order cancelled successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Only `pending` orders can be cancelled. Stock is restored. If order is paid via bank, includes `note: "Cancel (paid)"`.

| Status | errorCode | Condition                          |
|--------|-----------|------------------------------------|
| 404    | —         | Order not found (or not owned)     |
| 400    | —         | Order status is not `pending`      |

---

### 11.7 Contact Support

```
POST /api/orders/:orderId/contact  🔒
```

**Path Parameters**

| Param     | Type     | Description     |
|-----------|----------|-----------------|
| `orderId` | `string` | Order ObjectId  |

**Request Body**

```json
{
  "message": "string (required, non-empty after trim)"
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Support request submitted! We will respond as soon as possible.",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode       | Condition                          |
|--------|-----------------|------------------------------------|
| 404    | —               | Order not found (or not owned)     |
| 400    | `EMPTY_MESSAGE` | Message is empty or whitespace-only|

---

### 11.8 User Orders (v2)

```
GET /api/orders/me  🔒
```

**Query Parameters**

| Param   | Type     | Default | Description      |
|---------|----------|---------|------------------|
| `page`  | `number` | `1`     | Page number      |
| `limit` | `number` | `12`    | Items per page   |

**Success Response** `200` — same structure as v3 admin orders list (§15.2), but filtered to `user: req.user._id`.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a0531255f86810ffc27ba80",
      "code": "DH01KRJ4FYH7C9CXXG689FHZFQ11",
      "user": {
        "_id": "6a0489a70cdff9cd32a96b47",
        "name": "anh",
        "email": "anh6whisky81@gmail.com"
      },
      "items": [
        {
          "product": "6a04c15667914f2a821e414b",
          "name": "test name",
          "image": { "url": "…", "publicId": "…" },
          "price": 100000,
          "quantity": 3,
          "_id": "6a0531255f86810ffc27ba81"
        }
      ],
      "shippingAddress": {
        "fullName": "anh6q",
        "phone": "0377300999",
        "street": "Số 12",
        "wardCode": "90816",
        "districtId": 2264,
        "provinceId": 269,
        "wardName": "Thị Trấn Si Ma Cai",
        "districtName": "Huyện Si Ma Cai",
        "provinceName": "Lào Cai"
      },
      "payment": { "method": "cod", "status": "pending" },
      "fee": { "subtotal": 300000, "discount": 0 },
      "status": "confirmed",
      "shipping": {
        "provider": "ghn",
        "code": "LX7PWM",
        "status": "pending",
        "fee": 71500,
        "expectedDelivery": "2026-05-16T16:59:59.000Z"
      },
      "totalFee": 371500,
      "createdAt": "2026-05-14T02:19:17.419Z",
      "updatedAt": "2026-05-14T10:08:00.653Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 4,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field                         | Type               | Nullable | Description                                        |
|-------------------------------|--------------------|----------|----------------------------------------------------|
| `totalFee`                    | `number`           | No       | `fee.subtotal - fee.discount + shipping.fee`       |
| `fee.subtotal`                | `number`           | No       | Sum of `item.price × item.quantity`                |
| `fee.discount`                | `number`           | No       | Welcome discount (20% of subtotal) or 0            |
| `shipping`                    | `object` / `null`  | Yes      | `null` if no `ShippingOrder` exists for this order |
| `shipping.fee`                | `number`           | Yes      | GHN main service fee (not total)                   |
| `shipping.expectedDelivery`   | `string` (ISO) / `null` | Yes | GHN estimated delivery date                    |

---

### 11.9 Update Order Status (Admin)

```
PUT /api/orders/status  🔒🛡️
```

**Request Body**

```json
{
  "bulk": ["6a0531255f86810ffc27ba80"],
  "status": "confirmed"
}
```

| Field    | Type       | Required | Description                                      |
|----------|------------|----------|--------------------------------------------------|
| `bulk`   | `string[]` | Yes      | Array of order ObjectIds                         |
| `status` | `string`   | Yes      | One of: `pending`, `confirmed`, `shipping`, `delivered`, `cancelled` |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order status updated",
  "data": null,
  "meta": {
    "acknowledged": true,
    "modifiedCount": 1,
    "upsertedId": null,
    "upsertedCount": 0,
    "matchedCount": 1
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 11.10 Deprecated v2 Endpoints

| Endpoint                     | Status       | Replacement                                  |
|------------------------------|--------------|----------------------------------------------|
| `POST /api/orders/place`     | Returns 400  | `POST /api/v3/orders/cod/create`             |
| `POST /api/orders/stripe`    | Returns 400  | `POST /api/v3/orders/stripe/create`          |
| `GET /api/orders` (admin)    | Returns 400  | `GET /api/v3/admin/orders`                   |

---

## 12. Order Endpoints (v3)

Base path: `/api/v3`  
All endpoints require 🔒

---

### 12.1 Checkout Preview

```
POST /api/v3/orders/preview  🔒
```

> Use this to show shipping fee, estimated delivery time, and total **before** placing the order. This is read-only — nothing is persisted.

**Request Body**

```json
{
  "addressId": "string (required, valid ObjectId from user.addresses)",
  "orderItems": [
    { "product": "string (required)", "quantity": 2 }
  ]
}
```

| Field        | Type       | Required | Description                                           |
|--------------|------------|----------|-------------------------------------------------------|
| `addressId`  | `string`   | Yes      | Must be a valid ObjectId from `req.user.addresses`    |
| `orderItems` | `object[]` | No       | If omitted or empty, the **entire cart** is used      |

> Email verification is enforced (`EMAIL_NOT_VERIFIED`).  
> Welcome discount (20%) is previewed but **not consumed** — only `hasProductDiscount` is checked (no DB write).

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "product": "6a04c15667914f2a821e414b",
        "name": "iPhone 16 Pro Max",
        "image": {
          "url": "https://res.cloudinary.com/…/img.jpg",
          "publicId": "products/abc"
        },
        "price": 31490000,
        "quantity": 2
      }
    ],
    "fee": {
      "subtotal": 62980000,
      "shipping": 71500,
      "discount": 12596000,
      "total": 50455500
    },
    "estimatedDeliveryTime": "2026-05-16T16:59:59.000Z",
    "deliveryTimeRemaining": 204587,
    "availablePaymentMethods": ["cod", "stripe"]
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field                      | Type             | Description                                       |
|----------------------------|------------------|---------------------------------------------------|
| `fee.subtotal`             | `number`         | Sum of `item.salePrice × item.quantity`            |
| `fee.shipping`             | `number`         | GHN-calculated shipping fee (VND)                 |
| `fee.discount`             | `number`         | 20% of subtotal if welcome discount applies       |
| `fee.total`                | `number`         | `subtotal + shipping - discount`                  |
| `estimatedDeliveryTime`    | `string` (ISO)   | GHN estimated delivery date                       |
| `deliveryTimeRemaining`    | `number`         | GHN lead-time in seconds                          |
| `availablePaymentMethods`  | `string[]`       | Currently `["cod", "stripe"]`                     |

**Error Responses**

| Status | errorCode                | Condition                          |
|--------|--------------------------|------------------------------------|
| 403    | `EMAIL_NOT_VERIFIED`     | Email not verified                 |
| 400    | —                        | Invalid `addressId`                |
| 404    | —                        | Address not found                  |
| 400    | `EMPTY_CART`             | Cart is empty                      |
| 400    | `OUT_OF_STOCK`           | Product stock < requested quantity |
| 500    | `ESTIMATE_DELIVERY_TIME` | GHN delivery-time API failed       |
| 500    | `CALC_SHIPPING_FEE`      | GHN shipping-fee API failed        |

---

### 12.2 Place Order — COD

```
POST /api/v3/orders/cod/create  🔒
```

> **REPLACE:** `POST /api/orders/place`

**Request Body** — same as §12.1.

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Placed order successfully",
  "data": {
    "_id": "6a0551db4e44e758f4770a7e",
    "code": "DH01KRJCFGAC1HPAF9VBJYSCBCN7",
    "user": "6a0489a70cdff9cd32a96b47",
    "items": [ … ],
    "shippingAddress": { … },
    "payment": { "method": "cod", "status": "pending" },
    "fee": {
      "subtotal": 100000,
      "shipping": 71500,
      "discount": 0,
      "total": 171500
    },
    "status": "pending",
    "createdAt": "2026-05-14T04:38:51.473Z",
    "updatedAt": "2026-05-14T04:38:51.473Z"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> **Side effects:** Stock is decremented, cart is cleared (if `orderItems` was omitted), welcome discount is consumed (DB write), order confirmation email is sent.

---

### 12.3 Place Order — Stripe

```
POST /api/v3/orders/stripe/create  🔒
```

> **REPLACE:** `POST /api/orders/stripe`

**Request Body** — same as §12.1.

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Stripe session created",
  "data": {
    "session_url": "https://checkout.stripe.com/c/pay/…"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> The client must redirect the user to `session_url`.  
> The order is created in `status: "pending"`, `payment.status: "pending"`.  
> Stock is NOT decremented until payment is verified via `POST /api/v3/payments/stripe/checkout-session`.  
> Welcome discount is **consumed** at order creation (DB write).

---

### 12.4 Verify Stripe Checkout Session

```
POST /api/v3/payments/stripe/checkout-session  🔒
```

**Request Body**

```json
{
  "orderId": "string (required, valid ObjectId)",
  "success": "true",
  "fromCart": "true"
}
```

| Field      | Type     | Required | Description                                          |
|------------|----------|----------|------------------------------------------------------|
| `orderId`  | `string` | Yes      | Order ObjectId                                       |
| `success`  | `string` | Yes      | `"true"` for successful payment, `"false"` for cancel|
| `fromCart` | `string` | No       | `"true"` (default) — clears the cart on success      |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thanh toán thành công",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode                | Condition                          |
|--------|--------------------------|------------------------------------|
| 400    | —                        | Invalid `orderId`                  |
| 404    | —                        | Order not found                    |
| 403    | —                        | Order does not belong to user      |
| 400    | `STRIPE_PAYMENT_FAILED`  | `success === "false"` — order is deleted |

> On success: stock is decremented, cart is cleared (if `fromCart === "true"`), `payment.status` is set to `"paid"`. Idempotent — if already paid, returns 200 silently.

---

## 13. Address Endpoints (v3)

Base path: `/api/v3/addresses/3-level`  
All endpoints require 🔒

---

### 13.1 List Provinces

```
GET /api/v3/addresses/3-level/provinces  🔒
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 269,
      "name": "Lào Cai",
      "nameExtension": [
        "Lào Cai", "Lao Cai", "lao cai", "LC", "TP Lào Cai", "tỉnh Lào Cai"
      ],
      "status": true
    }
  ],
  "meta": null,
  "timestamp": "2026-05-13T14:24:54.821Z"
}
```

| Field            | Type       | Description                                                    |
|------------------|------------|----------------------------------------------------------------|
| `id`             | `number`   | GHN ProvinceID                                                 |
| `name`           | `string`   | Province name                                                  |
| `nameExtension`  | `string[]` | Alternative names for search / display                         |
| `status`         | `boolean`  | `true` = deliverable; `false` = blocked — **UX must disable**  |

---

### 13.2 List Districts

```
GET /api/v3/addresses/3-level/districts/:provinceId  🔒
```

**Path Parameters**

| Param        | Type     | Required | Description                       |
|--------------|----------|----------|-----------------------------------|
| `provinceId` | `number` | Yes      | Province ID from §13.1 (must be numeric) |

> Returns `400` if `provinceId` is `NaN`.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 2264,
      "provinceId": 269,
      "name": "Huyện Si Ma Cai",
      "nameExtension": [
        "Huyện Xi Ma Cai", "Huyện Si Ma Cai", "Si Ma Cai", "ximacai"
      ],
      "status": true
    }
  ],
  "meta": null,
  "timestamp": "2026-05-13T14:44:45.605Z"
}
```

---

### 13.3 List Wards

```
GET /api/v3/addresses/3-level/wards/:districtId  🔒
```

**Path Parameters**

| Param        | Type     | Required | Description                        |
|--------------|----------|----------|------------------------------------|
| `districtId` | `number` | Yes      | District ID from §13.2 (must be numeric) |

> Returns `400` if `districtId` is `NaN`.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "90816",
      "districtID": 2264,
      "name": "Thị Trấn Si Ma Cai",
      "nameExtension": [
        "thị trấn si ma cai", "thi tran si ma cai", "Thi Tran Si Ma Cai"
      ],
      "status": true
    }
  ],
  "meta": null,
  "timestamp": "2026-05-13T15:00:13.820Z"
}
```

> ⚠️ Note: `id` is a **string** (GHN ward code), not a number.

---

### 13.4 Add Address (v3)

```
POST /api/v3/addresses/3-level/user  🔒
```

> **REPLACE:** `POST /api/users/addresses` — this version captures `wardCode`, `districtId`, `provinceId` required for GHN shipping.

**Request Body**

```json
{
  "fullName": "string (required)",
  "phone": "string (required, Vietnamese phone format)",
  "street": "string (required)",
  "ward": "string (required)",
  "district": "string (required)",
  "province": "string (required)",
  "wardCode": "string (required)",
  "districtId": 2264,
  "provinceId": 269,
  "isDefault": false,
  "lat": null,
  "lng": null,
  "placeId": null
}
```

| Field        | Type               | Required | Default | Description                           |
|--------------|--------------------|----------|---------|---------------------------------------|
| `fullName`   | `string`           | Yes      | —       | Recipient name                        |
| `phone`      | `string`           | Yes      | —       | Vietnamese phone number               |
| `street`     | `string`           | Yes      | —       | Street address                        |
| `ward`       | `string`           | Yes      | —       | Ward name (from §13.3 `.name`)        |
| `district`   | `string`           | Yes      | —       | District name (from §13.2 `.name`)    |
| `province`   | `string`           | Yes      | —       | Province name (from §13.1 `.name`)    |
| `wardCode`   | `string`           | Yes      | —       | Ward code (from §13.3 `.id`)          |
| `districtId` | `number`           | Yes      | —       | District ID (from §13.2 `.id`)        |
| `provinceId` | `number`           | Yes      | —       | Province ID (from §13.1 `.id`)        |
| `isDefault`  | `boolean`          | No       | `false` | Sets all other addresses to non-default|
| `lat`        | `number` / `null`  | No       | `null`  | GPS latitude                          |
| `lng`        | `number` / `null`  | No       | `null`  | GPS longitude                         |
| `placeId`    | `string` / `null`  | No       | `null`  | Google Maps Place ID                  |

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Address added successfully",
  "data": {
    "_id": "6a04f…",
    "fullName": "anh6q",
    "phone": "0377300999",
    "street": "Số 12",
    "ward": "Thị Trấn Si Ma Cai",
    "district": "Huyện Si Ma Cai",
    "province": "Lào Cai",
    "wardCode": "90816",
    "districtId": 2264,
    "provinceId": 269,
    "isDefault": false,
    "lat": null,
    "lng": null,
    "placeId": null,
    "createdAt": "2026-05-14T04:00:00.000Z",
    "updatedAt": "2026-05-14T04:00:00.000Z"
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> **UX note:** The frontend should cascade-select: province → district → ward from the master-data APIs above. Use the returned `id`/`wardCode` values — these are directly consumed by GHN for shipping rate calculation and order placement.

---

## 14. Admin Endpoints

Base path: `/api/admin`  
All endpoints require 🔒🛡️

---

### 14.1 Admin Stats (Dashboard)

```
GET /api/admin/stats  🔒🛡️
```

**Query Parameters**

| Param       | Type     | Required | Description                           |
|-------------|----------|----------|---------------------------------------|
| `startDate` | `string` | No       | ISO date string, default: 30 days ago |
| `endDate`   | `string` | No       | ISO date string, default: now         |

> When no date filters are provided, `changes` and `period` meta are `null`.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "setting": {
      "_id": "…",
      "lowStockThreshold": 10,
      "banners": [ … ]
    },
    "stats": {
      "orderCount": 120,
      "revenue": 150000000,
      "paidRevenue": 120000000,
      "productCount": 48,
      "userCount": 200,
      "totalSoldUnits": 350,
      "topProducts": [ … ],
      "lowStockProducts": [ … ],
      "lowStockThreshold": 10,
      "statusCounts": {
        "pending": 5,
        "confirmed": 10,
        "shipping": 8,
        "delivered": 95,
        "cancelled": 2
      },
      "changes": {
        "orderCount": 15.5,
        "revenue": 22.1,
        "paidRevenue": 18.3,
        "userCount": 10.0,
        "totalSoldUnits": 12.7
      }
    }
  },
  "meta": {
    "period": {
      "current": { "$gte": "2026-04-14T…", "$lte": "2026-05-14T…" },
      "prev": { "$gte": "2026-03-15T…", "$lte": "2026-04-14T…" }
    },
    "topProductsLimit": 8,
    "lowStockProductsLimit": 12
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Field                          | Type             | Nullable | Description                                    |
|--------------------------------|------------------|----------|------------------------------------------------|
| `changes`                      | `object` / `null`| Yes      | % change vs previous period; `null` if no dates |
| `changes.orderCount`           | `number` / `null`| Yes      | 1 decimal place, e.g. `15.5` = +15.5%          |
| `lowStockThreshold`            | `number`         | No       | Configured in Settings collection               |
| `lowStockProducts`             | `object[]`       | No       | Products where `stock ≤ lowStockThreshold`      |
| `topProducts`                  | `object[]`       | No       | Top 8 by `soldCount`                            |

---

### 14.2 Admin — Products

#### 14.2.1 Get Product Detail (Admin View)

```
GET /api/admin/products/:productId  🔒🛡️
```

Returns the full product + **all reviews** (including hidden) with populated user info.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "product": { … },
    "reviews": [ … ]
  },
  "meta": {
    "totalReviews": 10,
    "hiddenReviews": 2
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.2.2 Create Product

```
POST /api/admin/products  🔒🛡️
Content-Type: multipart/form-data
```

**Form Data**

| Field           | Type     | Required | Description                                    |
|-----------------|----------|----------|------------------------------------------------|
| `name`          | `string` | Yes      | Product name                                   |
| `description`   | `string` | Yes      | Product description                            |
| `price`         | `number` | Yes      | Base price (VND)                               |
| `category`      | `string` | Yes      | Category                                       |
| `brand`         | `string` | Yes      | Brand                                          |
| `stock`         | `number` | Yes      | Stock quantity                                 |
| `note`          | `string` | No       | Additional notes                               |
| `specifications`| `string` | No       | JSON-encoded array of `{key, value}`           |
| `discount`      | `number` | No       | 0-100 (percentage), default: 0                 |
| `saleStartAt`   | `string` | No       | ISO date                                       |
| `saleEndAt`     | `string` | No       | ISO date                                       |
| `img1`          | `file`   | No       | Image 1                                        |
| `img2`          | `file`   | No       | Image 2                                        |
| `img3`          | `file`   | No       | Image 3                                        |
| `img4`          | `file`   | No       | Image 4                                        |

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created",
  "data": { "_id": "6a04c…" },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.2.3 Update Product

```
PUT /api/admin/products/:productId  🔒🛡️
```

**Request Body** — any subset of product fields (partial update):

```json
{
  "name": "string",
  "description": "string",
  "price": 100000,
  "category": "string",
  "brand": "string",
  "specifications": [{ "key": "RAM", "value": "8GB" }],
  "note": "string",
  "stock": 50,
  "discount": 20,
  "saleStartAt": "2026-05-01T00:00:00.000Z",
  "saleEndAt": null
}
```

> All fields are optional. Only provided fields are updated. Images are not updatable via this endpoint.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product updated",
  "data": { … },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.2.4 Bulk Delete Products

```
DELETE /api/admin/products  🔒🛡️
```

**Request Body**

```json
{
  "bulk": ["6a04c…", "6a04c…"]
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products deleted successfully",
  "data": null,
  "meta": {
    "deletedProductCount": 2,
    "deletedImageCount": 4,
    "deletedReviewCount": 0
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Also deletes associated Cloudinary images. Review deletion is not yet implemented (`deletedReviewCount` is always 0).

---

### 14.3 Admin — Reviews

#### 14.3.1 List All Reviews

```
GET /api/admin/reviews  🔒🛡️
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a05…",
      "user": { "_id": "…", "name": "anh", "email": "…" },
      "product": { "_id": "…", "name": "iPhone 16" },
      "rating": 5,
      "comment": "Tuyệt vời!",
      "media": [ … ],
      "isHidden": false,
      "createdAt": "2026-05-14T04:00:00.000Z",
      "updatedAt": "2026-05-14T04:00:00.000Z"
    }
  ],
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.3.2 Toggle Review Hidden

```
PUT /api/admin/reviews/:id/toggle-hidden  🔒🛡️
```

**Path Parameters**

| Param | Type     | Description     |
|-------|----------|-----------------|
| `id`  | `string` | Review ObjectId |

Toggles `isHidden` (true ↔ false).

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Review visibility updated",
  "data": { … },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.3.3 Bulk Delete Reviews

```
DELETE /api/admin/reviews  🔒🛡️
```

**Request Body**

```json
{
  "bulk": ["6a05…", "6a05…"]
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reviews deleted successfully",
  "data": null,
  "meta": {
    "deletedCount": 2,
    "affectedProducts": 1
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 14.4 Admin — Users

#### 14.4.1 List All Users

```
GET /api/admin/users  🔒🛡️
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a04…",
      "name": "anh",
      "email": "anh6whisky81@gmail.com",
      "role": "user",
      "isActive": true,
      "isEmailVerified": true,
      "avatar": { "url": "…", "publicId": "…" },
      "addresses": [ … ],
      "cart": [ … ],
      "favorites": [ … ],
      "createdAt": "2026-05-14T02:00:00.000Z",
      "updatedAt": "2026-05-14T02:00:00.000Z"
    }
  ],
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.4.2 Toggle User Active

```
PATCH /api/admin/users/:id/toggle-active  🔒🛡️
```

Toggles `isActive` (true ↔ false). Inactive users receive `NON_EXISTENT_ACCOUNT` on any protected request.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User status updated",
  "data": { … },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

#### 14.4.3 Bulk Deactivate Users

```
POST /api/admin/users/bulk-deactivate  🔒🛡️
```

**Request Body**

```json
{
  "bulk": ["6a04…", "6a04…"]
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Updated successfully",
  "data": {
    "matchedCount": 2,
    "modifiedCount": 2
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 14.5 Admin — Subscribers

```
GET /api/admin/subscribers  🔒🛡️
```

Returns active subscribers sorted by `createdAt` descending.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a05…",
      "email": "user@example.com",
      "name": "anh",
      "hasUsedWelcomeDiscount": false,
      "createdAt": "2026-05-14T02:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

## 15. Admin Endpoints (v3)

Base path: `/api/v3/admin`  
All endpoints require 🔒🛡️

---

### 15.1 Bulk Create Shipping Orders

```
POST /api/v3/admin/shipping-orders/bulk-create  🔒🛡️
```

> Confirms orders and creates GHN shipping orders in bulk. Only pending orders can be processed.

**Request Body**

```json
{
  "bulk": ["6a0531255f86810ffc27ba80", "6a0551db4e44e758f4770a7e"]
}
```

| Field  | Type       | Required | Description              |
|--------|------------|----------|--------------------------|
| `bulk` | `string[]` | Yes      | Array of order ObjectIds |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "",
  "data": {
    "success": 2,
    "failed": 0
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> **Side effects:** Creates `ShippingOrder` records, updates `Order.status` to `"confirmed"`.  
> If the DB transaction fails, attempts to cancel the created GHN orders.

---

### 15.2 List Orders (Admin, Paginated)

```
GET /api/v3/admin/orders  🔒🛡️
```

> **REPLACE:** `GET /api/orders` (v2 returns "Unsupport")

**Query Parameters**

| Param   | Type     | Default | Description      |
|---------|----------|---------|------------------|
| `page`  | `number` | `1`     | Page number      |
| `limit` | `number` | `12`    | Max 100          |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "6a0551db4e44e758f4770a7e",
      "code": "DH01KRJCFGAC1HPAF9VBJYSCBCN7",
      "user": {
        "_id": "6a0489a70cdff9cd32a96b47",
        "name": "anh",
        "email": "anh6whisky81@gmail.com"
      },
      "items": [
        {
          "product": "6a04c15667914f2a821e414b",
          "name": "test name",
          "image": { "url": "…", "publicId": "…" },
          "price": 100000,
          "quantity": 1,
          "_id": "6a0551db4e44e758f4770a7e"
        }
      ],
      "shippingAddress": {
        "fullName": "anh6q",
        "phone": "0377300999",
        "street": "Số 12",
        "wardCode": "90816",
        "districtId": 2264,
        "provinceId": 269,
        "wardName": "Thị Trấn Si Ma Cai",
        "districtName": "Huyện Si Ma Cai",
        "provinceName": "Lào Cai"
      },
      "payment": { "method": "bank", "status": "paid" },
      "fee": { "subtotal": 100000, "discount": 0 },
      "status": "confirmed",
      "shipping": {
        "provider": "ghn",
        "code": "LX7PW8",
        "status": "pending",
        "fee": 71500,
        "expectedDelivery": "2026-05-16T16:59:59.000Z"
      },
      "totalFee": 171500,
      "createdAt": "2026-05-14T04:38:51.473Z",
      "updatedAt": "2026-05-14T10:08:00.657Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 4,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Returns all orders (any status, any user). `shipping` is `null` when no `ShippingOrder` exists for the order.  
> `totalFee` = `fee.subtotal - fee.discount + shipping.fee`.

---

## 16. Settings Endpoints

Base path: `/api/setting`  
All endpoints require 🔒🛡️

---

### 16.1 Get Config

```
GET /api/setting/config  🔒🛡️
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "_id": "…",
    "lowStockThreshold": 10,
    "createdAt": "2026-05-14T02:00:00.000Z",
    "updatedAt": "2026-05-14T02:00:00.000Z",
    "banners": [
      {
        "_id": "…",
        "name": "Summer Sale",
        "url": "https://res.cloudinary.com/…/banner.jpg",
        "isActive": true
      }
    ]
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 16.2 Add Banner

```
POST /api/setting/banners  🔒🛡️
Content-Type: multipart/form-data
```

**Form Data**

| Field  | Type     | Required | Description        |
|--------|----------|----------|--------------------|
| `img`  | `file`   | Yes      | Banner image       |
| `name` | `string` | No       | Banner name/label  |

**Success Response** `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Created successfully",
  "data": {
    "_id": "…",
    "name": "Summer Sale",
    "url": "https://res.cloudinary.com/…/banner.jpg",
    "isActive": true
  },
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> The first banner ever created is auto-set as active. Subsequent banners default to `isActive: false`.

---

### 16.3 Toggle Active Banner

```
PUT /api/setting/banners/:index  🔒🛡️
```

**Path Parameters**

| Param   | Type     | Description                          |
|---------|----------|--------------------------------------|
| `index` | `number` | Zero-based index in the `banners` array |

Sets the banner at `index` to active (`isActive: true`) and deactivates all others.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Banner updated successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition                |
|--------|-----------|--------------------------|
| 404    | —         | Setting document not found |
| 400    | —         | Invalid index            |

---

## 17. Marketing Endpoints

Base path: `/api/marketing`  
All endpoints require 🔒🛡️

---

### 17.1 Send Bulk Promotion Email

```
POST /api/marketing/send-promo  🔒🛡️
```

**Request Body**

```json
{
  "subject": "🔥 Ưu đãi đặc biệt từ ABC Shop!",
  "promoCode": "SUMMER2026",
  "productIds": ["6a04c…"]
}
```

| Field        | Type       | Required | Description                                       |
|--------------|------------|----------|---------------------------------------------------|
| `subject`    | `string`   | No       | Email subject line                                |
| `promoCode`  | `string`   | No       | Promo code to display in the email                |
| `productIds` | `string[]` | No       | Product IDs to feature; if omitted, top 6 on-sale |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": null,
  "meta": {
    "sent": 15,
    "failed": 0,
    "total": 15
  },
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Sends HTML emails to all **active** subscribers. Individual failures don't stop the batch.

---

### 17.2 Apply Bulk Discount

```
POST /api/marketing/bulk-discount  🔒🛡️
```

**Request Body**

```json
{
  "productIds": ["6a04c…", "6a04c…"],
  "discount": 20,
  "saleStartAt": "2026-05-15T00:00:00.000Z",
  "saleEndAt": "2026-05-31T23:59:59.000Z"
}
```

| Field         | Type       | Required | Description                          |
|---------------|------------|----------|--------------------------------------|
| `productIds`  | `string[]` | No       | If omitted, applies to **all** products |
| `discount`    | `number`   | Yes      | 0-100 (percentage)                   |
| `saleStartAt` | `string`   | No       | ISO date; `null` = immediate         |
| `saleEndAt`   | `string`   | No       | ISO date; `null` = no end            |

| Status | errorCode | Condition                              |
|--------|-----------|----------------------------------------|
| 400    | —         | `discount` not in 0-100 range          |
| 400    | —         | `saleStartAt ≥ saleEndAt`              |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Successfully applied 20% discount to 48 products",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

---

### 17.3 Remove Bulk Discount

```
DELETE /api/marketing/bulk-discount  🔒🛡️
```

**Request Body**

```json
{
  "productIds": ["6a04c…"]
}
```

| Field        | Type       | Required | Description                          |
|--------------|------------|----------|--------------------------------------|
| `productIds` | `string[]` | No       | If omitted, removes from **all** products |

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Deleted discount Successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Sets `discount = 0`, `saleStartAt = null`, `saleEndAt = null`.

---

## 18. Subscriber Endpoints

Base path: `/api/subscribers`

---

### 18.1 Register (Subscribe)

```
POST /api/subscribers  🔓
```

**Request Body**

```json
{
  "email": "string (required, valid email)",
  "name": "string (optional)"
}
```

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "success",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

> Idempotent — if email already exists, updates `name`, sets `isActive: true`, and links to the `User` if one exists with that email.

| Status | errorCode       | Condition        |
|--------|-----------------|------------------|
| 400    | `INVALID_EMAIL` | Invalid email    |

---

### 18.2 Unsubscribe

```
POST /api/subscribers/unsubscribe  🔒
```

> Uses the authenticated user's email. Sets `isActive: false` on the matching `Subscriber` record.

**Success Response** `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unsubscribed successfully",
  "data": null,
  "meta": null,
  "timestamp": "2026-05-14T14:14:30.244Z"
}
```

| Status | errorCode | Condition                                   |
|--------|-----------|---------------------------------------------|
| 404    | `NOT_FOUND` | No active subscriber found for this email |

---

## Appendix A: Order Status Flow

```
pending → confirmed → shipping → delivered
     ↘ cancelled
```

| Status      | Meaning                                          |
|-------------|--------------------------------------------------|
| `pending`   | Order created, awaiting admin confirmation       |
| `confirmed` | Admin confirmed, shipping order sent to GHN      |
| `shipping`  | In transit (manual status update)                |
| `delivered` | Delivered (manual status update or GHN webhook)  |
| `cancelled` | Cancelled by user or system                      |

---

## Appendix B: Payment Methods

| Method   | Key        | Verification                |
|----------|------------|-----------------------------|
| COD      | `cod`      | No verification needed      |
| Stripe   | `bank`     | Client-side checkout → API verify |
| MoMo     | `momo`     | Webhook (IPN) / redirect    |
| VNPay    | `vnpay`    | Redirect return URL         |

**V3 endpoints** only support `cod` and `bank` (Stripe).  
**V2 endpoints** support `momo` and `vnpay` in addition.

---

## Appendix C: Common Patterns for Frontend

### C.1 Making Authenticated Requests

All protected endpoints expect the `token` cookie set by login/register. The browser sends it automatically for same-origin requests. For cross-origin (e.g. `localhost:5173` → `localhost:5000`), ensure `credentials: "include"` is set:

```javascript
fetch("http://localhost:5000/api/users/profile", {
  credentials: "include"
});
```

### C.2 Uploading Files

Use `FormData` with `multipart/form-data`. Example (avatar):

```javascript
const form = new FormData();
form.append("avatar", fileInput.files[0]);
fetch("/api/users/avatar", { method: "POST", body: form, credentials: "include" });
```

### C.3 Checkout Flow (v3)

```
1. GET /api/v3/addresses/3-level/provinces → populate dropdown
2. GET /api/v3/addresses/3-level/districts/:provinceId → populate dropdown
3. GET /api/v3/addresses/3-level/wards/:districtId → populate dropdown
4. POST /api/v3/addresses/3-level/user → save address
5. GET /api/users/profile → get addressId
6. POST /api/v3/orders/preview → show shipping fee + ETA + total
7. User confirms → POST /api/v3/orders/cod/create (or stripe)
```

### C.4 Welcome Discount

A 20% welcome discount is automatically applied for subscribers (`Subscriber.hasUsedWelcomeDiscount === false`) on their first order. The discount is previewed in step 6 (no DB write) and consumed in step 7 (DB write — irreversible). The frontend should display a banner: "🎉 20% off your first order!"
