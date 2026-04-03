// backend/services/momoService.js
import axios from "axios";
import crypto from "crypto";

// Endpoint sandbox MoMo (đổi sang production khi deploy thật)
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";

/**
 * Tạo link thanh toán MoMo
 * @param {object} param0
 * @param {string} param0.orderId   - ID đơn hàng
 * @param {number} param0.amount    - Số tiền (VNĐ)
 * @param {string} param0.orderInfo - Mô tả đơn hàng
 * @param {string} param0.returnUrl - URL redirect sau thanh toán
 * @param {string} param0.notifyUrl - Webhook URL
 */
export const createMoMoPayment = async ({ orderId, amount, orderInfo, returnUrl, notifyUrl }) => {
  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529";
  const accessKey   = process.env.MOMO_ACCESS_KEY   || "klm05TvNBzhg7h7j";
  const secretKey   = process.env.MOMO_SECRET_KEY   || "at67qH6mk8w5Y1nAyMoTKhpBoM7XOyFK";
  const requestId   = `${partnerCode}_${Date.now()}`;
  const extraData   = "";
  const requestType = "payWithATM";

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${notifyUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${returnUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: notifyUrl,
    requestType,
    extraData,
    signature,
    lang: "vi",
  };

  try {
    const { data } = await axios.post(MOMO_ENDPOINT, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return data; // data.payUrl là URL thanh toán
  } catch (error) {
    throw new Error(`MoMo request failed: ${error.message}`);
  }
};

/**
 * Xác minh chữ ký IPN từ MoMo webhook
 */
export const verifyMoMoSignature = (body) => {
  const secretKey = process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoTKhpBoM7XOyFK";
  const {
    accessKey, amount, extraData, message,
    orderId, orderInfo, orderType, partnerCode,
    payType, requestId, responseTime, resultCode,
    transId, signature,
  } = body;

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `message=${message}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `orderType=${orderType}`,
    `partnerCode=${partnerCode}`,
    `payType=${payType}`,
    `requestId=${requestId}`,
    `responseTime=${responseTime}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ].join("&");

  const computed = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return computed === signature;
};
