// backend/controllers/order.controller.js
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import mongoose from "mongoose";
import { createMoMoPayment } from "../services/momoService.js";
import { createVNPayUrl } from "../services/vnpayService.js";
import { sendOrderConfirmation } from "../services/emailService.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";

const shippingPrice = 20000;
const currency = "vnd";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getEffectivePrice = (product) => {
  const now = new Date();
  const inSale =
    product.discount > 0 &&
    (!product.saleStartAt || product.saleStartAt <= now) &&
    (!product.saleEndAt || product.saleEndAt >= now);
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

const buildLineItems = async (productIds, quantities) => {
  let itemsPrice = 0;
  const lineItems = [];
  const products = await Product
    .find({ _id: { $in: productIds } })
    .select("name price stock images")
    .lean({ virtuals: true });
  if (products.length !== productIds.length) throw new AppError("Invalid product id", 400);
  for (const product of products) {
    if (product.stock < quantities[product._id]) throw new AppError(`Out of stock: ${product.name}`, 400);
    itemsPrice += product.salePrice * quantities[product._id];
  }
  return {
    itemsPrice, lineItems: products.map(p => ({
      product: p._id,
      name: p.name,
      image: {
        url: p.images?.[0]?.url || p.images[0] || "https://cloud.my/1.img",
        publicId: p.images[0]?.publicId || "imported"
      },
      quantity: quantities[p._id],
      price: p.salePrice
    }))
  };
};

// ✅ Kiểm tra và áp dụng ưu đãi chào mừng 20% cho đơn đầu tiên
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

    await Subscriber.findByIdAndUpdate(subscriber._id, {
      hasUsedWelcomeDiscount: true
    });

    return true;
  } catch (e) {
    return false;
  }
};

export const placeOrder = async (req, res) => {
  if (!req.user.isEmailVerified)
    throw new AppError("Please verify your email \
        before purchasing products", 400);

  const userId = req.user._id;
  let { addressId, orderItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addressId))
    throw new ValidationError("Invalid address ID");
  const address = req.user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Address not found");

  // orderItems: [{ product: ObjectId, quantity: number }]

  let ordersInCartFlag = !Array.isArray(orderItems) || orderItems.length === 0;
  if (ordersInCartFlag) {
    orderItems = req.user.cart;
  } else {
    orderItems = orderItems.map(item => {
      if (
        !item.product || !item.quantity
        || item.quantity < 1 || !mongoose.Types.ObjectId.isValid(item.product))
        return undefined;
      return { product: item.product, quantity: item.quantity };
    }).filter(Boolean);
  }

  if (!orderItems.length) throw new AppError("Cannot buy with an empty cart", 400);
  const productIds = [];
  const quantities = {};
  for (const item of orderItems) {
    productIds.push(item.product);
    quantities[item.product] = item.quantity;
  }

  const { itemsPrice, lineItems } = await buildLineItems(productIds, quantities);

  const session = await mongoose.startSession();
  let newOrderId;
  try {
    await session.withTransaction(async () => {
      const [created] = await Order.create([{
        user: userId,
        items: lineItems,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          ward: address.ward,
          province: address.province
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
        if (!updated) throw new AppError("INSUFFICIENT_STOCK", 400);
      }

      if (ordersInCartFlag)
        await User.findByIdAndUpdate(userId, { cart: [] }, { session });
    });
  } catch (err) {
    throw err;
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
  });
  ApiResponse
    .created({ 
      orderId: newOrderId, 
      welcomeDiscount: usedWelcome 
    }, "Ordered successfully")
    .send(res);
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
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&method=stripe`,
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
      orderId: newOrder._id.toString(),
      amount: newOrder.totalPrice,
      orderInfo: `Thanh toan don hang #${newOrder._id}`,
      returnUrl: `${origin}/verify?method=momo&orderId=${newOrder._id}`,
      notifyUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/orders/momo-ipn`,
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
      orderId: newOrder._id.toString(),
      amount: newOrder.totalPrice,
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
    const { verifyVNPayReturn: verifyFn } = await import("../services/vnpayService.js");
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
  const { orderId } = req.params;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(orderId))
        throw new ValidationError("Invalid order id");
      const order = await Order.findOne({
        _id: orderId,
        user: req.user._id
      }).session(session);
      if (!order)
        throw new NotFoundError("Order not found");
      if (order.status !== "pending")
        throw new AppError("Only pending orders can be canceled", 400);
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
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
  ApiResponse.success("Order canceled successfully").send(res);
};

// ─── Contact Support ──────────────────────────────────────────────────────────
export const contactSupport = async (req, res) => {
  const { orderId } = req.params;
  const { message } = req.body;
  if (!message?.trim())
    throw new AppError("Message cannot be empty", 400);
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id
  });
  if (!order) throw new NotFoundError("Order not found");
  // TODO: create new table to save message from user like this [time][user][message]
  ApiResponse.success("Support request submitted successfully! \
    We will respond as soon as possible.").send(res);
};

// ─── List Orders (admin) ──────────────────────────────────────────────────────
export const ordersList = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const orders = await Order
    .find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .lean({ virtuals: true });
  new ApiResponse(true, 200, "Success", orders, {
    orderCount: orders.length,
    page, limit, skip
  }).send(res);
};

export const userOrders = async (req, res) => {
  const orders = await Order
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });
  new ApiResponse(true, 200, "Success", orders, null).send(res);
};

export const updateStatus = async (req, res) => {
  const { bulk, status } = req.body;
  if (
    !Array.isArray(bulk) ||
    bulk.length === 0 ||
    !bulk.every(id => mongoose.Types.ObjectId.isValid(id))
  ) {
    throw new AppError("Invalid order ids", 400);
  }
  const result = await Order.updateMany(
    {
      _id: {
        $in: bulk
      }
    },
    {
      $set: {
        status
      }
    }
  );
  new ApiResponse(
    true, 200,
    "Order status updated",
    null, result)
    .send(res);
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
