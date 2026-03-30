// backend/services/emailService.js
// npm install nodemailer
import nodemailer from 'nodemailer'

const createTransporter = () => nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT)   || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

// ─── Gửi email xác nhận đơn hàng ─────────────────────────────────────────────
export const sendOrderConfirmation = async ({ to, name, orderId, items, totalPrice }) => {
    const transporter = createTransporter()
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

    const itemsHtml = items.map(i =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.price)}</td>
        </tr>`
    ).join('')

    await transporter.sendMail({
        from: `"ABC Shop" <${process.env.SMTP_USER}>`,
        to,
        subject: `✅ Xác nhận đơn hàng #${orderId}`,
        html: `
        <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;background:#F5F4FF;padding:24px;border-radius:16px">
          <h2 style="color:#4F46E5;margin-bottom:4px">Xin chào ${name}! 🎉</h2>
          <p style="color:#6B7280">Đơn hàng của bạn đã được xác nhận.</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:16px 0;border:1.5px solid #EDE9FE">
            <p style="color:#1E1B4B;font-weight:600;margin-bottom:12px">Mã đơn: <code>${orderId}</code></p>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#EEF2FF">
                  <th style="padding:8px;text-align:left;color:#4F46E5">Sản phẩm</th>
                  <th style="padding:8px;text-align:center;color:#4F46E5">SL</th>
                  <th style="padding:8px;text-align:right;color:#4F46E5">Giá</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="margin-top:16px;text-align:right;font-size:18px;font-weight:700;color:#4F46E5">
              Tổng: ${fmt(totalPrice)}
            </div>
          </div>
          <p style="color:#6B7280;font-size:13px">Cảm ơn bạn đã mua sắm tại ABC Shop!</p>
        </div>`,
    })
}

// ─── Gửi email khuyến mãi hàng loạt ─────────────────────────────────────────
export const sendPromotionEmail = async ({ to, name, subject, products, promoCode }) => {
    const transporter = createTransporter()
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

    const productsHtml = products.slice(0, 6).map(p =>
        `<div style="display:inline-block;width:150px;margin:8px;vertical-align:top;background:#fff;border-radius:12px;border:1.5px solid #EDE9FE;overflow:hidden">
          <img src="${p.images?.[0]}" alt="${p.name}" style="width:100%;height:120px;object-fit:cover"/>
          <div style="padding:8px">
            <p style="font-size:12px;color:#1E1B4B;margin:0 0 4px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</p>
            ${p.discount > 0 ? `<p style="font-size:11px;color:#EF4444;margin:0;text-decoration:line-through">${fmt(p.price)}</p>` : ''}
            <p style="font-size:13px;color:#4F46E5;margin:0;font-weight:700">${fmt(p.salePrice || p.price)}</p>
            ${p.discount > 0 ? `<span style="background:#FEE2E2;color:#EF4444;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700">-${p.discount}%</span>` : ''}
          </div>
        </div>`
    ).join('')

    await transporter.sendMail({
        from: `"ABC Shop" <${process.env.SMTP_USER}>`,
        to,
        subject: subject || `🔥 Ưu đãi đặc biệt từ ABC Shop`,
        html: `
        <div style="font-family:DM Sans,sans-serif;max-width:620px;margin:0 auto;background:#F5F4FF;padding:24px;border-radius:16px">
          <div style="background:linear-gradient(135deg,#1E1B4B,#4F46E5);padding:32px;border-radius:12px;text-align:center;margin-bottom:20px">
            <h1 style="color:#fff;margin:0;font-size:28px">🔥 Sale đặc biệt!</h1>
            <p style="color:#C4B5FD;margin:8px 0 0">Chào ${name}, đừng bỏ lỡ ưu đãi này</p>
          </div>
          ${promoCode ? `
          <div style="background:#4F46E5;color:#fff;padding:16px;border-radius:12px;text-align:center;margin-bottom:20px">
            <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Mã giảm giá của bạn</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:700;letter-spacing:4px">${promoCode}</p>
          </div>` : ''}
          <div style="text-align:center">${productsHtml}</div>
          <div style="text-align:center;margin-top:24px">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/collection" 
               style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">
              Mua sắm ngay →
            </a>
          </div>
          <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:24px">
            Bạn nhận được email này vì đã đăng ký nhận tin từ ABC Shop.<br>
            <a href="#" style="color:#6B7280">Hủy đăng ký</a>
          </p>
        </div>`,
    })
}
