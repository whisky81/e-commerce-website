# frontend
- phần tự gõ địa chỉ và map nên sync với nhau, placeId, lat, lng cũng nên sync với địa chỉ được gõ và địa chỉ được pick trên map cũng nên sync với các ô địa chỉ được gõ
- phần thời gian giao hàng ước tính đến địa chỉ mặc định nên để ở nơi khác để người dùng tiện theo dõi chứ không nên để trong hồ so 
- phần địa chỉ của user hiện tai chưa sync với địa chỉ trong phần đặt hàng vì khi đặt hàng không thấy địa chỉ nào cả
- khi vào cart mặc dù đã chọn địa chỉ mặc định khác nhưng phí vận chuyển dùng dường như là địa chỉ trước đó không phải là địa chỉ mặc định (isDefault === true)
- ở phần đặt hàng khi thêm địa chỉ thành công nhưng nó không sync với ux/ui dường như ux/ui chưa gọi để lấy danh sách địa chỉ
# backend
- lỗi không đăng nhập được vào admin, biết gateway để admin đăng nhập là từ phần đăng nhập của frontend
- không thể đăng nhập nên không biết lỗi của admin