### API V3 docs
#### Lưu ý
- đây là hệ thống e-commerce cho 1 cửa hàng
#### GET /api/v3/addresses/3-level/provinces
- require: loggin
- response
    + success
    ```javascript
    {
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": [
        {
            "id": 2002, 
            "name": "Hà Nội 02",
            "nameExtension": [
                "Hà Nội 02",
                "Hà Nội",
                "TP.Hà Nội",
                "TP. Hà Nội",
                "TP Hà Nội",
                "Thành phố Hà Nội",
                "hanoi",
                "HN",
                "ha noi"
            ],
            "status": true // status là false -> tỉnh này bị chặn không thể giao hàng được - ux/ui nên cấm người dùng chọn tỉnh có status là false khi người dùng thêm address
        },
        ... 
    ],
    "meta": null,
    "timestamp": "2026-05-13T14:24:54.821Z"
    }
    ```
    + failure 
    ```bash
    401
    400
    ```

#### GET /api/v3/addresses/3-level/districts/:provinceId
- require: 
    + loggin
    + provinceId phải là number (!isNaN(Number(provinceId)) === true)
- response
    + success
    ```javascript
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
                "Huyện Xi Ma Cai",
                "Huyện Si Ma Cai",
                "H.Xi Ma Cai",
                "H Xi Ma Cai",
                "Xi Ma Cai",
                "Huyen Xi Ma Cai",
                "ximacai",
                "Si Ma Cai"
            ],
            "status": true // false là quận/huyện này không thể giao hàng, ux/ui nên cấm người dùng chọn tỉnh có status là false khi người dùng thêm address
        },
        ...
    ],
        "meta": null,
        "timestamp": "2026-05-13T14:44:45.605Z"
    }
    ```

#### GET GET /api/v3/addresses/3-level/wards/:districtID
- require: 
    + loggin
    + districtId phải là number (!isNaN(Number(districtId)) === true)
- response 
    + success
    ```javascript
    {
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": [
        {
            "id": "90816", // chính là ward code
            "districtID": 2264,
            "name": "Thị Trấn Si Ma Cai",
            "nameExtension": [
                "thị trấn si ma cai",
                "thi tran si ma cai",
                "Thi Tran Si Ma Cai",
                "thị trấn xi ma cai"
            ],
            "status": true // false xã phường này không thể giao hàngn, ux/ui nên cấm người dùng chọn tỉnh có status là false khi người dùng thêm address 
        },
        ...
    ],
        "meta": null,
        "timestamp": "2026-05-13T15:00:13.820Z"
    }
    ```


#### POST /api/v3/addresses/3-level/user
- notes
    + yêu cầu đăng nhập
    + api có chức năng thêm 1 địa chỉ mới cho người dùng
    + dùng để thay thế `POST /api/users/addresses`
- req.body 
```javascript
{
    "fullName": "anh6q", // required
    "phone": "0377300999", // required
    "street": "Số 12",  // required 
    // ward, district, province, wardCode, districtId, provinceId lấy từ kq của 3 api trên (nên lấy như thế để có thể đặt hàng khi admin xác nhận vì dùng api bên thứ 3)
    "ward": "Thị Trấn Si Ma Cai", // required
    "district": "Huyện Si Ma Cai", // required
    "province": "Lào Cai", // required
    "wardCode": "90816",  // required
    "districtId": 2264, // required
    "provinceId": 269, // required

    "isDefault": true, // đặt làm địa chỉ mặc định 
    "lat": null, "lng": null , "placeId": null // nên sử dụng vì để ux/ui có vị trí trên bản đồ có thể visual cho người dùng 
}
```
- response
```javascript
{
    "success": true,
    "statusCode": 201,
    "message": "Address added successfully",
    "data": {
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
        "_id": "6a04997012a2582aef8e5751",
        "createdAt": "2026-05-13T15:32:00.190Z",
        "updatedAt": "2026-05-13T15:32:00.190Z"
    },
    "meta": null,
    "timestamp": "2026-05-13T15:32:00.423Z"
}
```


#### Notes | Những API update mà không tạo V3
- GET /api/users/profile
```javascript
// response của api bổ sung thêm fields sau



// estimatedDeliveryTime có giá trị null trong TH không có địa chỉ mặc định isDefault === true, hoặc lõi xảy ra trong quá trình fetch đến shipping api (đã được log lại)
"estimatedDeliveryTime": {
    "leadtime": 1778950799, // Unix timestamp (seconds) - thời gian dự kiến giao tới
    "deliveryTimeRemaining": { // chi tiết về khoảng thời gian dự kiến giao hàng tới  tính từ thời điểm gọi api tới thời điểm nhận được hàng - cái này được tính bằng new Date(leadtime * 1000).getTime() - Date.now()
        "days": 3,
        "hours": 0,
        "minutes": 44
    }
}
```


#### order notes
```bash
# workflow cho việc đặt hàng
Cart
  ↓
Preview / Pre-order API
  ↓
Frontend hiển thị:
- shipping fee
- ETA
- total
- warnings
  ↓
User confirm
  ↓
Place Order API
```

#### POST /api/v3/orders/preview
- notes
    + yêu cầu đăng nhập + xác minh email
    + addressId phải là id của người dùng đó
- req.body
```javascript
{
    "addressId": "6a04997012a2582aef8e5751",
    "orderItems": [
        {
            "product": "6a04c15667914f2a821e414b",
            "quantity": 3
        }
    ]
}
```
- response
```javascript
{
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": {
        "items": [
            {
                "product": "6a04c15667914f2a821e414b",
                "name": "test name",
                "image": {
                    "url": "https://res.cloudinary.com/doscck85q/image/upload/v1778696533/vlbiwcavipdjboxcztzs.jpg",
                    "publicId": "vlbiwcavipdjboxcztzs"
                },
                "quantity": 3,
                "price": 100000
            }
        ],
        "fee": {
            "subtotal": 300000,
            "shipping": 71500,
            "discount": 0,
            "total": 371500
        },
        "estimatedDeliveryTime": "2026-05-17T16:59:59.000Z",
        "deliveryTimeRemaining": {
            "days": 3,
            "hours": 22,
            "minutes": 27
        },
        "availablePaymentMethods": [
            "cod",
            "stripe"
        ]
    },
    "meta": null,
    "timestamp": "2026-05-13T18:32:47.789Z"
}
``` 

#### Notes khi đặt hàng
- với đơn hàng cod thì sau khi người dùng tạo đơn thành công --> admin kiểm tra và chấp nhận thì admin thực hiện gọi api có chức năng createShippingForOrder(orderId) với orderId là order id đó
- với đơn hàng stripe sau khi thanh toán thành công gọi đến `POST /api/v3/payments/stripe/checkout-session` thì sau đó vẫn đợi admin accept để tạo shipping order 




#### POST /api/v3/orders/cod/create
- api thay thế `POST /api/orders/place`
- req.body
```javascript
{
    "addressId": "6a04997012a2582aef8e5751",
    "orderItems": [
        {
            "product": "6a04c15667914f2a821e414b",
            "quantity": 8
        }
    ]
} 
```
- response
```javascript
{
    "success": true,
    "statusCode": 201,
    "message": "Placed order successfully",
    "data": {
        "user": "6a0489a70cdff9cd32a96b47",
        "items": [
            {
                "product": "6a04c15667914f2a821e414b",
                "name": "test name",
                "image": {
                    "url": "https://res.cloudinary.com/doscck85q/image/upload/v1778696533/vlbiwcavipdjboxcztzs.jpg",
                    "publicId": "vlbiwcavipdjboxcztzs"
                },
                "price": 100000,
                "quantity": 8,
                "_id": "6a05330cd33760da566f210d"
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
        "payment": {
            "method": "cod",
            "status": "pending"
        },
        "fee": {
            "shipping": 71500,
            "discount": 0,
            "subtotal": 800000,
            "total": 871500
        },
        "package": {
            "weight": 10,
            "length": 6,
            "width": 6,
            "height": 6
        },
        "status": "pending",
        "_id": "6a05330cd33760da566f210c",
        "code": "DH01KRJ4YTMM7AQ48DGBDFN0BRW5",
        "createdAt": "2026-05-14T02:27:24.952Z",
        "updatedAt": "2026-05-14T02:27:24.952Z",
        "__v": 0
    },
    "meta": null,
    "timestamp": "2026-05-14T02:27:28.502Z"
}
```


#### POST /api/v3/orders/stripe/create
- api thay thế `POST /api/orders/stripe`
- req.body
```javascript
{
    "addressId": "6a04997012a2582aef8e5751",
    "orderItems": [
        {
            "product": "6a04c15667914f2a821e414b",
            "quantity": 8
        }
    ]
} 
```
- response 

```javascript
{
    "success": true,
    "statusCode": 201,
    "message": "Stripe session created",
    "data": {
        "session_url": "https://checkout.stripe.com/c/pay/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // thanh toán xong sẽ forword đến success_url hoặc cancel_url để có thể từ đó gọi đến api  `POST /api/v3/payments/stripe/checkout-session`. success và cancel url có dạng `${front_end_url}/verify?success=true&orderId=abcddddd123&method=stripe` và cancel thì success=false&fromCart=true
        // fromCart có giá trị true or false -> để biết liệu nó mua từ cart hay custome body 
    },
    "meta": null,
    "timestamp": "2026-05-14T04:38:52.743Z"
}
```
#### POST /api/v3/payments/stripe/checkout-session
- api thay thế `POST /api/orders/verify-stripe`