// backend/controllers/v2/order.controller.js
import Stripe from "stripe";
import Order from "../../models/v2/Order.js";
import Product from "../../models/v2/Product.js";
import User from "../../models/v2/User.js";
import Subscriber from "../../models/v2/Subscriber.js";
import mongoose from "mongoose";
import { createMoMoPayment } from "../../services/momoService.js";
import { createVNPayUrl } from "../../services/vnpayService.js";
import { sendOrderConfirmation } from "../../services/emailService.js";
import nodemailer from "nodemailer";

const shippingPrice = 20000;
const currency = "vnd";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getEffectivePrice = (product) => {
  const now = new Date();
  const inSale =
    product.discount > 0 &&
    (!product.saleStartAt || product.saleStartAt <= now) &&
    (!product.saleEndAt   || product.saleEndAt   >= now);
  return inSale ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
};

const requireEmailVerified = (user) => {
  if (!user.isEmailVerified) {
    const err = new Error("Vui lòng xác nhận email trước khi mua hàng");
    err.status = 403;
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }
};

const buildLineItems = async (orderItems) => {
  let itemsPrice = 0;
  const lineItems = [];
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) throw { status: 404, message: "Không tìm thấy sản phẩm" };
    if (product.stock < item.quantity) throw { status: 400, message: `Không đủ hàng: ${product.name}` };
    const effectivePrice = getEffectivePrice(product);
    itemsPrice += effectivePrice * item.quantity;
    lineItems.push({
      product: item.product,
      quantity: item.quantity,
      name: product.name,
      image: product.images[0],
      price: effectivePrice,
      originalPrice: product.price
    });
  }
  return { itemsPrice, lineItems };
};

// ✅ Kiểm tra và áp dụng ưu đãi chào mừng 20% cho đơn đầu tiên
const applyWelcomeDiscount = async (userId, orderId) => {
  try {
    const subscriber = await Subscriber.findOne({ user: userId, isActive: true });
    if (!subscriber || subscriber.hasUsedWelcomeDiscount) return false;

    const order = await Order.findById(orderId);
    if (!order) return false;

    const discountedTotal = Math.round(order.totalPrice * 0.8);
    const discountAmount  = order.totalPrice - discountedTotal;

    await Order.findByIdAndUpdate(orderId, {
      totalPrice: discountedTotal,
      welcomeDiscount: true,
      welcomeDiscountAmount: discountAmount,
    });

    await Subscriber.findByIdAndUpdate(subscriber._id, {
      hasUsedWelcomeDiscount: true
    });

    return true;
  } catch (e) {
    console.error("Welcome discount error:", e.message);
    return false;
  }
};

// ─── COD ─────────────────────────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    requireEmailVerified(req.user);

    const userId = req.user._id;
    let { addressId, orderItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId))
      return res.status(400).json({ success: false, message: "Invalid address ID" });

    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    let ordersInCartFlag = orderItems == undefined;
    if (ordersInCartFlag) {
      orderItems = req.user.cart;
    } else {
      orderItems = orderItems.map(item => {
        if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product))
          return undefined;
        return { product: item.product, quantity: item.quantity };
      }).filter(Boolean);
    }

    if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

    const { itemsPrice, lineItems } = await buildLineItems(orderItems);

    const session = await mongoose.startSession();
    let newOrderId;
    try {
      await session.withTransaction(async () => {
        const [created] = await Order.create([{
          user: userId,
          items: lineItems,
          shippingAddress: {
            fullName: address.fullName, phone: address.phone,
            street: address.street, ward: address.ward,
            district: address.district, province: address.province
          },
          itemsPrice, shippingPrice,
          totalPrice: itemsPrice + shippingPrice,
        }], { session });
        newOrderId = created._id;

        for (const item of orderItems) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, soldCount: item.quantity } },
            { session, new: true }
          );
          if (!updated) throw new Error("INSUFFICIENT_STOCK");
        }

        if (ordersInCartFlag)
          await User.findByIdAndUpdate(userId, { cart: [] }, { session });
      });
    } catch (err) {
      if (err.message === "INSUFFICIENT_STOCK")
        return res.status(400).json({ success: false, message: "Không đủ hàng trong kho" });
      throw err;
    } finally {
      session.endSession();
    }

    // ✅ Áp dụng welcome discount nếu là subscriber
    const usedWelcome = await applyWelcomeDiscount(userId, newOrderId);

    // Gửi email xác nhận
    try {
      const finalOrder = await Order.findById(newOrderId);
      await sendOrderConfirmation({
        to: req.user.email,
        name: req.user.name,
        orderId: newOrderId,
        items: finalOrder.items,
        totalPrice: finalOrder.totalPrice,
        welcomeDiscount: finalOrder.welcomeDiscount,
        welcomeDiscountAmount: finalOrder.welcomeDiscountAmount,
      });
    } catch (e) {
      console.error("Order confirmation email failed:", e.message);
    }

    res.status(201).json({
      success: true,
      message: usedWelcome
        ? "Đặt hàng thành công! 🎉 Ưu đãi chào mừng 20% đã được áp dụng!"
        : "Đặt hàng thành công",
      data: { orderId: newOrderId, welcomeDiscount: usedWelcome }
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
export const placeOrderStripe = async (req, res) => {
  try {
    requireEmailVerified(req.user);

    const userId = req.user._id;
    let { addressId, orderItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId))
      return res.status(400).json({ success: false, message: "Invalid address ID" });

    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    let ordersInCartFlag = orderItems == undefined;
    if (ordersInCartFlag) {
      orderItems = req.user.cart;
    } else {
      orderItems = orderItems.map(item => {
        if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product))
          return undefined;
        return { product: item.product, quantity: item.quantity };
      }).filter(Boolean);
    }

    if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

    const { itemsPrice, lineItems } = await buildLineItems(orderItems);
    const newOrder = await Order.create({
      user: userId, items: lineItems,
      shippingAddress: {
        fullName: address.fullName, phone: address.phone,
        street: address.street, ward: address.ward,
        district: address.district, province: address.province
      },
      itemsPrice, shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
      paymentMethod: "stripe",
    });

    const stripeItems = lineItems.map(item => ({
      price_data: { currency, product_data: { name: item.name }, unit_amount: item.price },
      quantity: item.quantity,
    }));
    stripeItems.push({
      price_data: { currency, product_data: { name: "Phí vận chuyển" }, unit_amount: shippingPrice },
      quantity: 1
    });

    const { origin } = req.headers;
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&method=stripe`,
      cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}&method=stripe`,
      mode: "payment",
      line_items: stripeItems,
    });

    res.status(201).json({ success: true, data: { session_url: stripeSession.url } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── MoMo ─────────────────────────────────────────────────────────────────────
export const placeOrderMoMo = async (req, res) => {
  try {
    requireEmailVerified(req.user);

    const userId = req.user._id;
    let { addressId, orderItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId))
      return res.status(400).json({ success: false, message: "Invalid address ID" });

    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    let ordersInCartFlag = orderItems == undefined;
    if (ordersInCartFlag) {
      orderItems = req.user.cart;
    } else {
      orderItems = orderItems.map(item => {
        if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product))
          return undefined;
        return { product: item.product, quantity: item.quantity };
      }).filter(Boolean);
    }

    if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

    const { itemsPrice, lineItems } = await buildLineItems(orderItems);

    const newOrder = await Order.create({
      user: userId, items: lineItems,
      shippingAddress: {
        fullName: address.fullName, phone: address.phone,
        street: address.street, ward: address.ward,
        district: address.district, province: address.province
      },
      itemsPrice, shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
      paymentMethod: "momo",
    });

    const { origin } = req.headers;
    const result = await createMoMoPayment({
      orderId:  newOrder._id.toString(),
      amount:   newOrder.totalPrice,
      orderInfo: `Thanh toan don hang #${newOrder._id}`,
      returnUrl: `${origin}/verify?method=momo&orderId=${newOrder._id}`,
      notifyUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v2/orders/momo-ipn`,
    });

    if (result.resultCode !== 0) {
      await Order.findByIdAndDelete(newOrder._id);
      return res.status(400).json({ success: false, message: result.message || "MoMo payment failed" });
    }

    res.status(201).json({ success: true, data: { payUrl: result.payUrl, orderId: newOrder._id } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── VNPay ────────────────────────────────────────────────────────────────────
export const placeOrderVNPay = async (req, res) => {
  try {
    requireEmailVerified(req.user);

    const userId = req.user._id;
    let { addressId, orderItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId))
      return res.status(400).json({ success: false, message: "Invalid address ID" });

    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    let ordersInCartFlag = orderItems == undefined;
    if (ordersInCartFlag) {
      orderItems = req.user.cart;
    } else {
      orderItems = orderItems.map(item => {
        if (!item.product || !item.quantity || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product))
          return undefined;
        return { product: item.product, quantity: item.quantity };
      }).filter(Boolean);
    }

    if (!orderItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

    const { itemsPrice, lineItems } = await buildLineItems(orderItems);

    const newOrder = await Order.create({
      user: userId, items: lineItems,
      shippingAddress: {
        fullName: address.fullName, phone: address.phone,
        street: address.street, ward: address.ward,
        district: address.district, province: address.province
      },
      itemsPrice, shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
      paymentMethod: "vnpay",
    });

    const { origin } = req.headers;
    const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";

    const payUrl = createVNPayUrl({
      orderId:   newOrder._id.toString(),
      amount:    newOrder.totalPrice,
      returnUrl: `${origin}/verify?method=vnpay&orderId=${newOrder._id}`,
      ipAddr,
    });

    res.status(201).json({ success: true, data: { payUrl, orderId: newOrder._id } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Verify MoMo IPN (webhook) ────────────────────────────────────────────────
export const verifyMoMoIPN = async (req, res) => {
  try {
    const { orderId, resultCode } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ success: false });

    if (resultCode === 0) {
      const order = await Order.findById(orderId);
      if (!order || order.isPaid) return res.status(200).json({ success: true });

      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        for (const line of order.items) {
          const updated = await Product.findOneAndUpdate(
            { _id: line.product, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity, soldCount: line.quantity } },
            { session, new: true }
          );
          if (!updated) throw new Error("INSUFFICIENT_STOCK");
        }
        order.isPaid = true; order.paidAt = new Date(); order.status = "confirmed";
        await order.save({ session });
        await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
      });
      session.endSession();

      await applyWelcomeDiscount(order.user, orderId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Verify VNPay Return ──────────────────────────────────────────────────────
export const verifyVNPayReturn = async (req, res) => {
  try {
    const { verifyVNPayReturn: verifyFn } = await import("../../services/vnpayService.js");
    const isValid = verifyFn(req.query);
    const orderId = req.query.vnp_TxnRef;

    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    if (isValid) {
      const order = await Order.findById(orderId);
      if (!order || order.isPaid) return res.json({ success: true, message: "Thanh toán thành công" });

      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        for (const line of order.items) {
          const updated = await Product.findOneAndUpdate(
            { _id: line.product, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity, soldCount: line.quantity } },
            { session, new: true }
          );
          if (!updated) throw new Error("INSUFFICIENT_STOCK");
        }
        order.isPaid = true; order.paidAt = new Date(); order.status = "confirmed";
        await order.save({ session });
        await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
      });
      session.endSession();

      await applyWelcomeDiscount(order.user, orderId);
      return res.json({ success: true, message: "Thanh toán thành công" });
    } else {
      await Order.findByIdAndDelete(orderId);
      return res.status(400).json({ success: false, message: "Thanh toán thất bại" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền hủy đơn này" });

    if (order.status !== "pending")
      return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn hàng đang chờ xử lý (pending)" });

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity, soldCount: -item.quantity } },
          { session }
        );
      }
      order.status = "cancelled";
      await order.save({ session });
    });
    session.endSession();

    res.status(200).json({ success: true, message: "Đã hủy đơn hàng thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Contact Support ──────────────────────────────────────────────────────────
export const contactSupport = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: "Nội dung không được trống" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền" });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"ABC Shop Support" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[Hỗ trợ đơn hàng] #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
          <div style="background: #fff; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px">📩 Yêu cầu hỗ trợ từ khách hàng</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 120px"><b>Khách hàng:</b></td><td>${req.user.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280"><b>Email:</b></td><td>${req.user.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280"><b>Mã đơn:</b></td><td style="font-family: monospace">#${orderId}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280"><b>Trạng thái:</b></td><td>${order.status}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;"><b>Nội dung:</b><br>${message.replace(/\n/g, "<br>")}</p>
            </div>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "Đã gửi yêu cầu hỗ trợ! Chúng tôi sẽ phản hồi sớm nhất." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── List Orders (admin) ──────────────────────────────────────────────────────
export const ordersList = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email").sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const userOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    await Order.findByIdAndUpdate(orderId, { status });
    res.status(200).json({ success: true, message: "Order status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyStripe = async (req, res) => {
  try {
    const { orderId, success } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    if (success === "true") {
      let session;
      try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
          const order = await Order.findById(orderId).session(session);
          if (!order) throw new Error("ORDER_NOT_FOUND");
          if (order.user.toString() !== req.user._id.toString()) throw new Error("FORBIDDEN_ORDER");
          if (order.isPaid) return;
          for (const line of order.items) {
            const updated = await Product.findOneAndUpdate(
              { _id: line.product, stock: { $gte: line.quantity } },
              { $inc: { stock: -line.quantity, soldCount: line.quantity } },
              { session, new: true }
            );
            if (!updated) throw new Error("INSUFFICIENT_STOCK");
          }
          order.isPaid = true; order.paidAt = new Date(); order.status = "confirmed";
          await order.save({ session });
          await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });
        });
      } catch (err) {
        if (err.message === "INSUFFICIENT_STOCK") return res.status(400).json({ success: false, message: "Không đủ hàng trong kho" });
        if (err.message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        if (err.message === "FORBIDDEN_ORDER") return res.status(403).json({ success: false, message: "Không hợp lệ" });
        throw err;
      } finally { session?.endSession(); }

      await applyWelcomeDiscount(req.user._id, orderId);
      return res.json({ success: true, message: "Thanh toán thành công" });
    } else {
      await Order.findByIdAndDelete(orderId);
      res.status(400).json({ success: false, message: "Thanh toán thất bại, đơn hàng đã hủy" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
