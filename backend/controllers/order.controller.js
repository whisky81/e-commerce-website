// backend/controllers/order.controller.js
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import mongoose from "mongoose";
import { createMoMoPayment } from "../services/momoService.js";
import { createVNPayUrl, verifyVNPayReturn as verifyVNPayFn } from "../services/vnpayService.js";
import { sendOrderConfirmation } from "../services/emailService.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import logger from "../config/Logger.js";

const SHIPPING_PRICE = 20000;
const STRIPE_CURRENCY = "vnd";

// Lazy-initialize Stripe để tránh crash khi module được import trước dotenv load
let _stripe = null;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Xác thực email đã verify — ném AppError nếu chưa verify
 */
const requireEmailVerified = (user) => {
  if (!user.isEmailVerified) {
    throw new AppError(
      "Vui lòng xác nhận email trước khi mua hàng",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }
};

/**
 * Tính giá effective của product (salePrice nếu đang trong thời gian sale)
 */
const getEffectivePrice = (product) => {
  const now = new Date();
  const inSale =
    product.discount > 0 &&
    (!product.saleStartAt || product.saleStartAt <= now) &&
    (!product.saleEndAt || product.saleEndAt >= now);
  return inSale
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;
};

/**
 * Parse và validate orderItems từ request body hoặc cart
 * Trả về array chuẩn: [{ product: ObjectId, quantity: number }]
 */
const resolveOrderItems = (orderItems, userCart) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return { items: userCart, fromCart: true };
  }
  const parsed = orderItems
    .map((item) => {
      if (
        !item.product ||
        !item.quantity ||
        item.quantity < 1 ||
        !mongoose.Types.ObjectId.isValid(item.product)
      )
        return undefined;
      return { product: item.product, quantity: Number(item.quantity) };
    })
    .filter(Boolean);
  return { items: parsed, fromCart: false };
};

/**
 * Tạo line items và tính itemsPrice từ danh sách orderItems
 * @param {Array} orderItems - [{ product: ObjectId|string, quantity: number }]
 */
const buildLineItems = async (orderItems) => {
  const productIds = orderItems.map((i) => i.product);
  const quantityMap = {};
  for (const i of orderItems) quantityMap[i.product.toString()] = i.quantity;

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price stock images discount saleStartAt saleEndAt")
    .lean({ virtuals: true });

  if (products.length !== productIds.length) {
    throw new AppError("Một hoặc nhiều sản phẩm không hợp lệ", 400, "INVALID_PRODUCT");
  }

  let itemsPrice = 0;
  const lineItems = products.map((p) => {
    const qty = quantityMap[p._id.toString()];
    if (p.stock < qty)
      throw new AppError(`Sản phẩm "${p.name}" không đủ hàng`, 400, "OUT_OF_STOCK");
    const price = getEffectivePrice(p);
    itemsPrice += price * qty;
    return {
      product: p._id,
      name: p.name,
      image: {
        url: p.images?.[0]?.url || p.images?.[0] || "https://cloud.my/1.img",
        publicId: p.images?.[0]?.publicId || "imported",
      },
      quantity: qty,
      price,
    };
  });

  return { itemsPrice, lineItems };
};

/**
 * Áp dụng ưu đãi chào mừng 20% cho đơn hàng đầu tiên của subscriber
 * Không throw error — thất bại âm thầm để không ảnh hưởng luồng chính
 */
const applyWelcomeDiscount = async (userId, orderId) => {
  try {
    const subscriber = await Subscriber.findOne({ user: userId, isActive: true });
    if (!subscriber || subscriber.hasUsedWelcomeDiscount) return false;

    const order = await Order.findById(orderId);
    if (!order) return false;

    const discountedTotal = Math.round(order.totalPrice * 0.8);
    const discountAmount = order.totalPrice - discountedTotal;

    await Order.findByIdAndUpdate(orderId, {
      totalPrice: discountedTotal,
      welcomeDiscount: true,
      welcomeDiscountAmount: discountAmount,
    });
    await Subscriber.findByIdAndUpdate(subscriber._id, { hasUsedWelcomeDiscount: true });
    return true;
  } catch (err) {
    logger.error("applyWelcomeDiscount failed", { userId, orderId, error: err.message });
    return false;
  }
};

/**
 * Trừ stock và cập nhật soldCount trong transaction
 */
const decrementStockInSession = async (items, session) => {
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, soldCount: item.quantity } },
      { session, new: true }
    );
    if (!updated) throw new AppError("Không đủ hàng trong kho", 400, "INSUFFICIENT_STOCK");
  }
};

// ─── COD ──────────────────────────────────────────────────────────────────────

export const placeOrder = async (req, res) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems, fromCart } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const { itemsPrice, lineItems } = await buildLineItems(resolvedItems);

  const session = await mongoose.startSession();
  let newOrderId;
  try {
    await session.withTransaction(async () => {
      const [created] = await Order.create(
        [
          {
            user: userId,
            items: lineItems,
            shippingAddress: {
              fullName: address.fullName,
              phone: address.phone,
              street: address.street,
              ward: address.ward,
              province: address.province,
            },
            itemsPrice,
            shippingPrice: SHIPPING_PRICE,
            totalPrice: itemsPrice + SHIPPING_PRICE,
            paymentMethod: "cod",
          },
        ],
        { session }
      );
      newOrderId = created._id;
      await decrementStockInSession(resolvedItems, session);
      if (fromCart) await User.findByIdAndUpdate(userId, { cart: [] }, { session });
    });
  } finally {
    session.endSession();
  }

  const usedWelcome = await applyWelcomeDiscount(userId, newOrderId);
  const finalOrder = await Order.findById(newOrderId).lean({ virtuals: true });

  await sendOrderConfirmation({
    to: req.user.email,
    name: req.user.name,
    orderId: newOrderId,
    items: finalOrder.items,
    totalPrice: finalOrder.totalPrice,
    welcomeDiscount: finalOrder.welcomeDiscount,
    welcomeDiscountAmount: finalOrder.welcomeDiscountAmount,
  }).catch((err) =>
    logger.error("sendOrderConfirmation failed", { orderId: newOrderId, error: err.message })
  );

  ApiResponse.created({ orderId: newOrderId, welcomeDiscount: usedWelcome }, "Ordered successfully").send(res);
};

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const placeOrderStripe = async (req, res) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const { itemsPrice, lineItems } = await buildLineItems(resolvedItems);

  const newOrder = await Order.create({
    user: userId,
    items: lineItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      province: address.province,
    },
    itemsPrice,
    shippingPrice: SHIPPING_PRICE,
    totalPrice: itemsPrice + SHIPPING_PRICE,
    paymentMethod: "stripe",
  });

  const stripeLineItems = lineItems.map((item) => ({
    price_data: {
      currency: STRIPE_CURRENCY,
      product_data: { name: item.name },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));
  stripeLineItems.push({
    price_data: {
      currency: STRIPE_CURRENCY,
      product_data: { name: "Phí vận chuyển" },
      unit_amount: SHIPPING_PRICE,
    },
    quantity: 1,
  });

  const { origin } = req.headers;
  const stripeSession = await getStripe().checkout.sessions.create({
    success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&method=stripe`,
    cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&method=stripe`,
    mode: "payment",
    line_items: stripeLineItems,
  });

  ApiResponse.created({ session_url: stripeSession.url }, "Stripe session created").send(res);
};

// ─── MoMo ─────────────────────────────────────────────────────────────────────

export const placeOrderMoMo = async (req, res) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const { itemsPrice, lineItems } = await buildLineItems(resolvedItems);

  const newOrder = await Order.create({
    user: userId,
    items: lineItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      province: address.province,
    },
    itemsPrice,
    shippingPrice: SHIPPING_PRICE,
    totalPrice: itemsPrice + SHIPPING_PRICE,
    paymentMethod: "momo",
  });

  const { origin } = req.headers;
  const result = await createMoMoPayment({
    orderId: newOrder._id.toString(),
    amount: newOrder.totalPrice,
    orderInfo: `Thanh toan don hang #${newOrder._id}`,
    returnUrl: `${origin}/verify?method=momo&orderId=${newOrder._id}`,
    notifyUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/orders/momo-ipn`,
  });

  if (result.resultCode !== 0) {
    await Order.findByIdAndDelete(newOrder._id);
    throw new AppError(result.message || "MoMo payment request failed", 400, "MOMO_PAYMENT_FAILED");
  }

  ApiResponse.created({ payUrl: result.payUrl, orderId: newOrder._id }, "MoMo payment initiated").send(res);
};

// ─── VNPay ────────────────────────────────────────────────────────────────────

export const placeOrderVNPay = async (req, res) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const { itemsPrice, lineItems } = await buildLineItems(resolvedItems);

  const newOrder = await Order.create({
    user: userId,
    items: lineItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      province: address.province,
    },
    itemsPrice,
    shippingPrice: SHIPPING_PRICE,
    totalPrice: itemsPrice + SHIPPING_PRICE,
    paymentMethod: "vnpay",
  });

  const { origin } = req.headers;
  const ipAddr =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";

  const payUrl = createVNPayUrl({
    orderId: newOrder._id.toString(),
    amount: newOrder.totalPrice,
    returnUrl: `${origin}/verify?method=vnpay&orderId=${newOrder._id}`,
    ipAddr,
  });

  ApiResponse.created({ payUrl, orderId: newOrder._id }, "VNPay payment initiated").send(res);
};

// ─── Verify Stripe (client-side confirm) ─────────────────────────────────────

export const verifyStripe = async (req, res) => {
  const { orderId, success } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new ValidationError("Invalid order ID");

  if (success === "true") {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw new NotFoundError("Order");
        if (order.user.toString() !== req.user._id.toString())
          throw new ForbiddenError("Bạn không có quyền thao tác với đơn hàng này");
        if (order.isPaid) return; // idempotent

        await decrementStockInSession(order.items, session);
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "confirmed";
        await order.save({ session });
        await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });
      });
    } finally {
      session.endSession();
    }
    await applyWelcomeDiscount(req.user._id, orderId);
    ApiResponse.success("Thanh toán thành công").send(res);
  } else {
    await Order.findByIdAndDelete(orderId);
    throw new AppError("Thanh toán thất bại, đơn hàng đã hủy", 400, "STRIPE_PAYMENT_FAILED");
  }
};

// ─── MoMo IPN Webhook ─────────────────────────────────────────────────────────

export const verifyMoMoIPN = async (req, res) => {
  const { orderId, resultCode } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    // IPN phải trả 200 dù sao — MoMo sẽ retry nếu không nhận được
    logger.warn("verifyMoMoIPN: invalid orderId", { orderId });
    return res.status(200).json({ success: false, message: "Invalid orderId" });
  }

  if (resultCode === 0) {
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn("verifyMoMoIPN: order not found", { orderId });
      return res.status(200).json({ success: false, message: "Order not found" });
    }
    if (order.isPaid) return res.status(200).json({ success: true }); // idempotent

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await decrementStockInSession(order.items, session);
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "confirmed";
        await order.save({ session });
        await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
      });
    } finally {
      session.endSession();
    }

    await applyWelcomeDiscount(order.user, orderId);
    logger.info("verifyMoMoIPN: payment confirmed", { orderId });
  } else {
    logger.warn("verifyMoMoIPN: payment failed", { orderId, resultCode });
  }

  res.status(200).json({ success: true });
};

// ─── VNPay Return (GET redirect) ──────────────────────────────────────────────

export const verifyVNPayReturn = async (req, res) => {
  const isValid = verifyVNPayFn(req.query);
  const orderId = req.query.vnp_TxnRef;

  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new ValidationError("Invalid order ID");

  if (isValid) {
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError("Order");
    if (order.isPaid) {
      return ApiResponse.success("Thanh toán thành công").send(res);
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await decrementStockInSession(order.items, session);
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "confirmed";
        await order.save({ session });
        await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
      });
    } finally {
      session.endSession();
    }

    await applyWelcomeDiscount(order.user, orderId);
    ApiResponse.success("Thanh toán thành công").send(res);
  } else {
    await Order.findByIdAndDelete(orderId);
    throw new AppError("Thanh toán thất bại", 400, "VNPAY_PAYMENT_FAILED");
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId))
    throw new ValidationError("Invalid order id");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, user: req.user._id }).session(session);
      if (!order) throw new NotFoundError("Order");
      if (order.status !== "pending")
        throw new AppError("Chỉ có thể hủy đơn hàng đang chờ xử lý", 400, "CANCEL_NOT_ALLOWED");

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
  } finally {
    session.endSession();
  }

  ApiResponse.success("Order cancelled successfully").send(res);
};

// ─── Contact Support ──────────────────────────────────────────────────────────

export const contactSupport = async (req, res) => {
  const { orderId } = req.params;
  const { message } = req.body;
  if (!message?.trim()) throw new AppError("Message cannot be empty", 400, "EMPTY_MESSAGE");

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new NotFoundError("Order");

  // TODO: persist support message to SupportMessage collection
  ApiResponse.success("Support request submitted! We will respond as soon as possible.").send(res);
};

// ─── List Orders (admin) ──────────────────────────────────────────────────────

export const ordersList = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Order.countDocuments({}),
  ]);

  ApiResponse.paginated(orders, { page, limit, total }).send(res);
};

// ─── User Orders ──────────────────────────────────────────────────────────────

export const userOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });
  ApiResponse.success("Success", orders).send(res);
};

// ─── Update Status (admin) ────────────────────────────────────────────────────

export const updateStatus = async (req, res) => {
  const { bulk, status } = req.body;
  if (
    !Array.isArray(bulk) ||
    bulk.length === 0 ||
    !bulk.every((id) => mongoose.Types.ObjectId.isValid(id))
  ) {
    throw new AppError("Invalid order ids", 400, "INVALID_IDS");
  }

  const result = await Order.updateMany({ _id: { $in: bulk } }, { $set: { status } });
  new ApiResponse(true, 200, "Order status updated", null, result).send(res);
};
