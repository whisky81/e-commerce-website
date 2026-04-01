// backend/services/emailService.js
import nodemailer from 'nodemailer'

const createTransporter = () => nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

// ─── Xác nhận đặt hàng ───────────────────────────────────────────────────────
export const sendOrderConfirmation = async ({ to, name, orderId, items, totalPrice }) => {
    const transporter = createTransporter()
    const itemsHtml = items.map(i => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;color:#111827">${i.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center;color:#4B5563">${i.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:600;color:#1D4ED8">${fmt(i.price)}</td>
        </tr>`).join('')

    await transporter.sendMail({
        from: `"ABC Shop" <${process.env.SMTP_USER}>`,
        to, subject: `✅ Xác nhận đơn hàng #${orderId}`,
        html: `
        <div style="background:#F8FAFC;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1E40AF,#3B82F6);padding:32px 28px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">🎉 Đặt hàng thành công!</h1>
              <p style="color:#BFDBFE;margin:8px 0 0;font-size:14px">Cảm ơn bạn đã mua sắm tại ABC Shop</p>
            </div>
            <!-- Body -->
            <div style="padding:28px">
              <p style="color:#374151;font-size:15px;margin:0 0 20px">Xin chào <strong>${name}</strong>,</p>
              <div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
                <p style="margin:0;font-size:13px;color:#1E40AF">Mã đơn hàng: <strong style="font-family:monospace;font-size:14px">#${orderId}</strong></p>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                  <tr style="background:#F3F4F6">
                    <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600">Sản phẩm</th>
                    <th style="padding:10px 12px;text-align:center;color:#374151;font-weight:600">SL</th>
                    <th style="padding:10px 12px;text-align:right;color:#374151;font-weight:600">Giá</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <div style="text-align:right;margin-top:16px;padding:12px 0;border-top:2px solid #E5E7EB">
                <span style="font-size:16px;font-weight:700;color:#1D4ED8">Tổng: ${fmt(totalPrice)}</span>
              </div>
            </div>
            <div style="background:#F8FAFC;padding:16px 28px;border-top:1px solid #E5E7EB;text-align:center">
              <p style="color:#6B7280;font-size:12px;margin:0">Nếu bạn có câu hỏi, hãy liên hệ <a href="mailto:${process.env.SMTP_USER}" style="color:#3B82F6">${process.env.SMTP_USER}</a></p>
            </div>
          </div>
        </div>`
    })
}

// ─── Email xác nhận địa chỉ email ────────────────────────────────────────────
export const sendVerificationEmail = async ({ to, name, token }) => {
    const transporter = createTransporter()
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`

    await transporter.sendMail({
        from: `"ABC Shop" <${process.env.SMTP_USER}>`,
        to, subject: '✉️ Xác nhận địa chỉ email của bạn - ABC Shop',
        html: `
        <div style="background:#F8FAFC;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
            <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:36px 28px;text-align:center">
              <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:32px">✉️</span>
              </div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Xác nhận Email</h1>
              <p style="color:#DDD6FE;margin:8px 0 0;font-size:14px">ABC Shop</p>
            </div>
            <div style="padding:32px 28px">
              <p style="color:#374151;font-size:15px;margin:0 0 8px">Xin chào <strong style="color:#1F2937">${name}</strong>!</p>
              <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
                Cảm ơn bạn đã đăng ký tài khoản tại ABC Shop. Vui lòng nhấn nút bên dưới để xác nhận địa chỉ email của bạn.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;
                          text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;
                          font-size:15px;letter-spacing:.3px">
                  ✅ Xác nhận Email
                </a>
              </div>
              <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin-top:20px">
                <p style="color:#92400E;font-size:12px;margin:0">⏰ Link xác nhận có hiệu lực trong <strong>24 giờ</strong></p>
              </div>
              <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0;line-height:1.5">
                Nếu bạn không thể nhấn nút, copy và dán đường link sau vào trình duyệt:<br>
                <a href="${verifyUrl}" style="color:#7C3AED;word-break:break-all;font-size:11px">${verifyUrl}</a>
              </p>
            </div>
            <div style="background:#F8FAFC;padding:16px 28px;border-top:1px solid #E5E7EB;text-align:center">
              <p style="color:#9CA3AF;font-size:12px;margin:0">Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>
            </div>
          </div>
        </div>`
    })
}

// ─── Email marketing khuyến mãi ───────────────────────────────────────────────
export const sendPromotionEmail = async ({ to, name, subject, products, promoCode }) => {
    const transporter = createTransporter()

    const productsHtml = products.slice(0, 6).map(p => `
        <div style="display:inline-block;width:155px;margin:8px;vertical-align:top;background:#fff;
                    border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="height:130px;overflow:hidden;background:#F9FAFB">
            <img src="${p.images?.[0]}" alt="${p.name}"
                 style="width:100%;height:130px;object-fit:cover"/>
          </div>
          <div style="padding:10px">
            <p style="font-size:12px;color:#111827;margin:0 0 6px;font-weight:600;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</p>
            ${p.discount > 0 ? `<p style="font-size:11px;color:#9CA3AF;margin:0 0 2px;text-decoration:line-through">${fmt(p.price)}</p>` : ''}
            <p style="font-size:14px;color:#1D4ED8;margin:0 0 6px;font-weight:700">${fmt(p.salePrice || p.price)}</p>
            ${p.discount > 0 ? `<span style="background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">-${p.discount}%</span>` : ''}
          </div>
        </div>`).join('')

    await transporter.sendMail({
        from: `"ABC Shop" <${process.env.SMTP_USER}>`,
        to, subject: subject || '🔥 Ưu đãi đặc biệt từ ABC Shop',
        html: `
        <div style="background:#F8FAFC;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto">
            <!-- Hero -->
            <div style="background:linear-gradient(135deg,#1E40AF,#7C3AED);padding:40px 28px;border-radius:16px 16px 0 0;text-align:center">
              <p style="color:#BFDBFE;margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">ABC SHOP</p>
              <h1 style="color:#fff;margin:0;font-size:30px;font-weight:800">🔥 Sale đặc biệt!</h1>
              <p style="color:#C4B5FD;margin:10px 0 0;font-size:15px">Xin chào <strong style="color:#fff">${name}</strong>, đừng bỏ lỡ ưu đãi này!</p>
            </div>

            <!-- Promo code -->
            ${promoCode ? `
            <div style="background:#fff;padding:20px 28px;border-left:4px solid #7C3AED;border-right:4px solid #7C3AED">
              <p style="margin:0 0 6px;font-size:12px;color:#6B7280;text-align:center;letter-spacing:1px;text-transform:uppercase">Mã giảm giá của bạn</p>
              <div style="background:#F5F3FF;border:2px dashed #7C3AED;border-radius:10px;padding:12px;text-align:center">
                <span style="font-size:26px;font-weight:800;color:#7C3AED;letter-spacing:4px;font-family:monospace">${promoCode}</span>
              </div>
            </div>` : ''}

            <!-- Products -->
            <div style="background:#fff;padding:24px 20px;${promoCode ? '' : 'border-radius:0 0 16px 16px;'}">
              <h2 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 16px;text-align:center">🛍️ Sản phẩm đang sale</h2>
              <div style="text-align:center">${productsHtml}</div>
              <div style="text-align:center;margin-top:24px">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collection"
                   style="display:inline-block;background:linear-gradient(135deg,#1E40AF,#7C3AED);color:#fff;
                          text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">
                  Mua sắm ngay →
                </a>
              </div>
            </div>

            <div style="text-align:center;padding:20px;border-radius:0 0 16px 16px;background:#F1F5F9">
              <p style="color:#94A3B8;font-size:11px;margin:0">
                Bạn nhận được email này vì đã đăng ký nhận tin từ ABC Shop.<br>
                <a href="#" style="color:#7C3AED">Hủy đăng ký</a>
              </p>
            </div>
          </div>
        </div>`
    })
}
