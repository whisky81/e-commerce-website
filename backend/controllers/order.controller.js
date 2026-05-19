// backend/controllers/order.controller.js
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import mongoose from "mongoose";
import SupportMessage from "../models/SupportMessage.js";
import { createMoMoPayment } from "../services/momoService.js";
import { createVNPayUrl, verifyVNPayReturn as verifyVNPayFn } from "../services/vnpayService.js";
import { sendOrderConfirmation } from "../services/emailService.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import logger from "../config/Logger.js";
import shippingProvider from "../config/shipping.js";
import ShippingOrder from "../models/ShippingOrder.js";

const SHIPPING_PRICE = 20000;
const STRIPE_CURRENCY = "vnd";

// Lazy-initialize Stripe để tránh crash khi module được import trước dotenv load
let _stripe = null;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

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
  const productIds = [];
  const quantityMap = {};
  for (const i of orderItems) {
    productIds.push(i.product);
    quantityMap[i.product] = i.quantity;
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price stock images discount saleStartAt saleEndAt specifications")
    .lean({ virtuals: true });

  if (products.length !== productIds.length) {
    throw new AppError("Một hoặc nhiều sản phẩm không hợp lệ", 400, "INVALID_PRODUCT");
  }

  let itemsPrice = 0;
  let weight = 0;
  let nums = {
    length: 6,
    width: 6,
    height: 6
  }
  const lineItems = products.map((p) => {
    const qty = quantityMap[p._id.toString()];
    if (p.stock < qty)
      throw new AppError(`Sản phẩm "${p.name}" không đủ hàng`, 400, "OUT_OF_STOCK");
    itemsPrice += p.salePrice * qty;
    for (const spec of p.specifications) {
      if (spec.key === "weight") weight += spec.value;
      if (["length", "width", "height"].includes(spec.key)) nums[spec.key] = Math.max(nums[spec.key], spec.value);
    }
    return {
      product: p._id,
      name: p.name,
      image: {
        url: p.images?.[0]?.url || p.images?.[0] || "https://cloud.my/1.img",
        publicId: p.images?.[0]?.publicId || "imported",
      },
      quantity: qty,
      price: p.salePrice,
    };
  });

  return { itemsPrice, lineItems, weight: Math.max(weight, 10), ...nums };
};

/**
 * Áp dụng ưu đãi chào mừng 20% cho đơn hàng đầu tiên của subscriber
 * Không throw error — thất bại âm thầm để không ảnh hưởng luồng chính
 */
const applyWelcomeDiscount = async (userId, orderId) => {
  try {
    const subscriber = await Subscriber.findOne({ user: userId, isActive: true });
    if (!subscriber || subscriber.hasUsedWelcomeDiscount) return false;
    await Subscriber.findByIdAndUpdate(subscriber._id, { hasUsedWelcomeDiscount: true });
    return true;
  } catch (err) {
    logger.error("applyWelcomeDiscount failed", { userId, error: err.message });
    return false;
  }
};

const hasProductDiscount = async (userId) => {
  try {
    const subscriber = await Subscriber.findOne({ user: userId, isActive: true });
    if (!subscriber || subscriber.hasUsedWelcomeDiscount) return false;
    return true;
  } catch (err) {
    return false;
  }
}

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

export const placeOrder = async (req, res) => {
  new ApiResponse(false, 400, "Unsupport").send(res);
};

export const placeOrderStripe = async (req, res) => {
  new ApiResponse(false, 400, "Unsupport").send(res);
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

  const { items: resolvedItems, fromCart } = resolveOrderItems(rawItems, req.user.cart);
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
    fromCart,
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

  const { items: resolvedItems, fromCart } = resolveOrderItems(rawItems, req.user.cart);
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
    fromCart,
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
  new ApiResponse(false, 400, "Unsupport").send(res);
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
        // Chỉ clear cart nếu đơn hàng được đặt từ cart
        if (order.fromCart) {
          await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
        }
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
        // Chỉ clear cart nếu đơn hàng được đặt từ cart
        if (order.fromCart) {
          await User.findByIdAndUpdate(order.user, { cart: [] }, { session });
        }
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

  await SupportMessage.create({
    order: order._id,
    user: req.user._id,
    message: message.trim()
  });

  ApiResponse.success("Support request submitted! We will respond as soon as possible.").send(res);
};

export const userSupportMessages = async (req, res) => {
  const messages = await SupportMessage.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  ApiResponse.success("Success", messages).send(res);
};

// ─── List Orders (admin) ──────────────────────────────────────────────────────

export const ordersList = async (req, res) => {
  new ApiResponse(false, 400, "Unsupport").send(res);
};

const ordersData = async (skip, limit, filter) => {
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select("-package")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  const orderIds = orders.map(order => order._id);

  const shippingOrders = await ShippingOrder.find({
    order: { $in: orderIds }
  })
    .select(
      "order provider providerOrderCode status fee.main expectedDelivery"
    )
    .lean();

  // O(1) lookup map
  const shippingMap = new Map(
    shippingOrders.map(shipping => [
      String(shipping.order),
      {
        provider: shipping.provider,
        code: shipping.providerOrderCode,
        status: shipping.status,
        fee: shipping.fee?.main ?? 0,
        expectedDelivery: shipping.expectedDelivery
      }
    ])
  );

  const data = orders
    .map((order) => ({
      ...order,
      shipping: shippingMap.get(String(order._id)) || null,
    }))
    .map((o) => {
      const subtotal = o.fee?.subtotal ?? o.itemsPrice ?? 0;
      const discount = o.fee?.discount ?? 0;
      const shipFee = o.shipping?.fee ?? o.fee?.shipping ?? o.shippingPrice ?? 0;
      const computedTotal = subtotal - discount + shipFee;
      return {
        ...o,
        totalFee:
          typeof o.totalFee === "number" && !Number.isNaN(o.totalFee)
            ? o.totalFee
            : (o.totalPrice ?? computedTotal),
      };
    });
  return { data, total };
}

export const ordersListV3 = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const search = req.query.search.trim();
    if (search.length === 24) {
      // Assuming it could be a valid MongoDB ObjectId
      filter.$or = [{ code: search }, { _id: search }];
    } else {
      filter.code = search;
    }
  }

  const { data, total } = await ordersData(skip, limit, filter);

  ApiResponse.paginated(data, {
    page,
    limit,
    total
  }).send(res);
};

// ─── User Orders ──────────────────────────────────────────────────────────────

export const userOrders = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const { data, total } = await ordersData(skip, limit, {user: req.user._id});
  // console.log(data, total);

  ApiResponse.paginated(data, {
    page,
    limit,
    total
  }).send(res);
};

// ─── Update Status (admin) ────────────────────────────────────────────────────
// vì đây là demo nên cứ để update status manua như này
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

export const previewOrder = async (req, res) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const {
    itemsPrice: subtotal,
    lineItems: items,
    weight, length, width, height
  } = await buildLineItems(resolvedItems);

  const discount = (await hasProductDiscount(userId)) ? Math.floor(subtotal * 0.2) : 0;
  const data = await shippingProvider.estimateDeliveryTime(0, address.districtId, address.wardCode);
  if (!data.success) throw new AppError("checkout preview error", 500, "ESTIMATE_DELIVERY_TIME");

  const { leadtime, deliveryTimeRemaining } = data.data;

  const shippingFeeRes = await shippingProvider.calcShippingFee(2, 0, address.wardCode, address.districtId, weight, length, width, height, items);
  if (!shippingFeeRes.success || !shippingFeeRes?.data?.total) throw new AppError("checkout preview error", 500, "CALC_SHIPPING_FEE");
  const shipping = shippingFeeRes.data.total;

  ApiResponse.success("Success", {
    items,
    fee: {
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount
    },
    estimatedDeliveryTime: new Date(leadtime * 1000),
    deliveryTimeRemaining,
    availablePaymentMethods: ["cod", "stripe"]
  }).send(res);
}

export const beforeOrder = async (req, res, next) => {
  requireEmailVerified(req.user);

  const userId = req.user._id;
  const { addressId, orderItems: rawItems } = req.body;

  // address 
  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address");

  const { items: resolvedItems, fromCart } = resolveOrderItems(rawItems, req.user.cart);
  if (!resolvedItems.length) throw new AppError("Giỏ hàng trống", 400, "EMPTY_CART");

  const {
    itemsPrice: subtotal,
    lineItems: items,
    weight, length, width, height
  } = await buildLineItems(resolvedItems);

  const shippingFeeRes = await shippingProvider.calcShippingFee(2, 0, address.wardCode, address.districtId, weight, length, width, height, items);
  if (!shippingFeeRes.success || !shippingFeeRes?.data?.total) throw new AppError("place order error", 500, "CALC_SHIPPING_FEE");
  const shipping = shippingFeeRes.data.total;

  req.resolvedItems = resolvedItems;
  req.fromCart = fromCart;
  req.fee = {
    subtotal,
    shipping
  };
  req.order = {
    user: userId,
    items,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,

      street: address.street,
      wardName: address.ward,
      districtName: address.district,
      provinceName: address.province,

      wardCode: address.wardCode,
      districtId: address.districtId,
      provinceId: address.provinceId
    },
    package: {
      weight, height, width, length
    }
  };
  next();
}


export const placeOrderV3 = async (req, res) => {
  const session = await mongoose.startSession();
  let newOrder;
  try {
    await session.withTransaction(async () => {
      const discount = (await applyWelcomeDiscount(req.user._id)) ? Math.floor(req.fee.subtotal * 0.2) : 0;
      const [created] = await Order.create(
        [
          {
            ...req.order,
            payment: {
              method: "cod",
              status: "pending"
            },
            fee: {
              shipping: req.fee.shipping,
              discount
            },
            status: "pending"
          },
        ],
        { session }
      );
      newOrder = created;
      await decrementStockInSession(req.resolvedItems, session);
      if (req.fromCart) await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });
    });
  } finally {
    session.endSession();
  }
  await sendOrderConfirmation({
    to: req.user.email,
    name: req.user.name,
    orderId: newOrder.code,
    items: newOrder.items,
    totalPrice: newOrder.fee.total,
    welcomeDiscount: newOrder.fee.discount !== 0,
    welcomeDiscountAmount: newOrder.fee.discount,
  }).catch((err) =>
    logger.error("sendOrderConfirmation failed", { orderId: newOrder.code, error: err.message })
  );
  ApiResponse.created(newOrder, "Placed order successfully").send(res);
}

export const placeOrderStripeV3 = async (req, res) => {
  const session = await mongoose.startSession();
  let newOrder;
  try {
    await session.withTransaction(async () => {
      const discount = (await applyWelcomeDiscount(req.user._id)) ? Math.floor(req.fee.subtotal * 0.2) : 0;
      const [created] = await Order.create(
        [
          {
            ...req.order,
            payment: {
              method: "bank",
              status: "pending"
            },
            fee: {
              shipping: req.fee.shipping,
              discount
            },
            status: "pending"
          },
        ],
        { session }
      );
      newOrder = created;
    });
  } finally {
    session.endSession();
  }

  const stripeLineItems = newOrder.items.map((item) => ({
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
      unit_amount: newOrder.fee.shipping,
    },
    quantity: 1,
  });

  const { origin = "https://test.org" } = req.headers;
  const sessionObj = {
    success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&method=stripe&fromCart=${req.fromCart}`,
    cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&method=stripe&fromCart=${req.fromCart}`,
    mode: "payment",
    line_items: stripeLineItems,
  };
  if (newOrder.fee.discount > 0) {
    const coupon = await getStripe().coupons.create({
      amount_off: newOrder.fee.discount,
      currency: STRIPE_CURRENCY,
      duration: "once",
    });
    sessionObj.discounts = [
      {
        coupon: coupon.id,
      }
    ];
  }
  const stripeSession = await getStripe().checkout.sessions.create(sessionObj);

  ApiResponse
    .created({
      session_url: stripeSession.url
    }, "Stripe session created")
    .send(res);
}

export const stripeCheckoutSession = async (req, res) => {
  const { orderId, success, fromCart = "true" } = req.body;

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
        if (order.payment.status === "paid") return; // idempotent

        await decrementStockInSession(order.items, session);
        order.payment.status = "paid";
        await order.save({ session });
        if (fromCart === "true") {
          await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });
        }
      });
    } finally {
      session.endSession();
    }
    ApiResponse.success("Thanh toán thành công").send(res);
  } else {
    // không revert lại discount nếu có -> thất bại xem như mất luôn -> đơn giản hóa
    await Order.findByIdAndDelete(orderId);
    throw new AppError("Thanh toán thất bại, đơn hàng đã hủy", 400, "STRIPE_PAYMENT_FAILED");
  }
}
