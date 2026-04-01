nên thống nhất toàn vẹn giá discount cho tất cả những nơi hiển thị sản phẩm (ở phần trang chủ, phần chi tiết sản phẩm và giá khi mua đều không áp dụng discount mặc dù nó discount và nhiều nơi khác nữa) -> hãy tìm kiếm và áp dụng 1 cách thống nhất

styling lại phần sendEmail trong backend vì chữ với nền không hợp với nhau nó làm mờ nhau
nên có email xác nhận đăng ký thành công -> từ đó bổ sung chức năng sau đây
  chỉ có email đã xác nhận mới có thể mua sắm
  sau khi đăng ký thành công gửi email xác nhận đến email người dùng
  người dùng có thể re-send để server gửi lại email xác nhận nếu nó hết hạn
  thông báo với người dùng email chưa xác nhân và người dùng có thể click hoặc nhấn nút để server gửi email xác nhận (chức năng tương tự với re-send email)

stylinh thống nhất trên toàn bộ ux/ui
tìm bug + error -> sửa và cải tiến nó 

bổ sung chức năng google map lên khi thêm địa chỉ và sau chọn địa chỉ giao hàng 
  nói chung là phần nào dùng được chức năng google map thì cứ áp dụng 

tạo ra file guide2.md để biết đã cải tiến, bổ sung những gì và cách sử dụng nó 



với phiên bản phía backend là v2 hãy
1: Thống kê được doanh thu (kiểm tra xem thống kê phía admin đã chuẩn chưa)
3: sale cần phải tự động, thông minh, chỉ cần nhập % (chính là discount - hãy bổ sung vào backend và áp dụng nó vào frontend và admin)
4: Nhập sản phẩm thông minh ( qua exel,...)
5: refactor để styling làm cho ux/ui đẹp hơn bằng tailwind (1 cách thổng nhất giữa frontend + admin)
6: fix lỗi paging phía frontend
7: Chiến lược tiếp thị( email tự động,..)
  lưu ý: đừng dùng nền trắng chữ đên hãy stylinng lại

* Báo cáo trong 2 tuần cuối(1 trong 2 tuần cuối)

7d: Đầy đủ các phương thức thanh toán (email xác thực)
9.5d: Deploy
9d: CHAT BOT tư vấn khách hàng
10d: Nhúng các công nghệ AI ( tự động xác nhận đơn hàng, xóa người dùng không hợp lệ)
