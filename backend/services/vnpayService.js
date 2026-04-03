// backend/services/vnpayService.js
import crypto from "crypto";
import querystring from "querystring";

/**
 * Tạo URL thanh toán VNPay
 */
export const createVNPayUrl = ({ orderId, amount, returnUrl, ipAddr }) => {
  const tmnCode    = process.env.VNPAY_TMN_CODE    || "DEMOV210";
  const hashSecret = process.env.VNPAY_HASH_SECRET  || "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ";
  const vnpUrl     = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  const now     = new Date();
  const pad     = (n, len = 2) => String(n).padStart(len, "0");
  const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const expireDateStr = `${expireDate.getFullYear()}${pad(expireDate.getMonth() + 1)}${pad(expireDate.getDate())}${pad(expireDate.getHours())}${pad(expireDate.getMinutes())}${pad(expireDate.getSeconds())}`;

  const vnpParams = {
    vnp_Version:     "2.1.0",
    vnp_Command:     "pay",
    vnp_TmnCode:     tmnCode,
    vnp_Locale:      "vn",
    vnp_CurrCode:    "VND",
    vnp_TxnRef:      orderId,
    vnp_OrderInfo:   `Thanh toan don hang ${orderId}`,
    vnp_OrderType:   "other",
    vnp_Amount:      amount * 100,  // VNPay yêu cầu nhân 100
    vnp_ReturnUrl:   returnUrl,
    vnp_IpAddr:      ipAddr || "127.0.0.1",
    vnp_CreateDate:  createDate,
    vnp_ExpireDate:  expireDateStr,
  };

  // Sắp xếp tham số theo alphabet
  const sorted = Object.fromEntries(
    Object.entries(vnpParams).sort(([a], [b]) => a.localeCompare(b))
  );

  const signData = querystring.stringify(sorted, { encode: false });
  const hmac     = crypto.createHmac("sha512", hashSecret);
  const signed   = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  sorted.vnp_SecureHash = signed;

  return `${vnpUrl}?${querystring.stringify(sorted, { encode: false })}`;
};

/**
 * Xác minh chữ ký VNPay trả về
 * @returns {boolean}
 */
export const verifyVNPayReturn = (query) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET || "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ";
  const { vnp_SecureHash, vnp_SecureHashType, ...params } = query;

  const sorted = Object.fromEntries(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  );

  const signData = querystring.stringify(sorted, { encode: false });
  const hmac     = crypto.createHmac("sha512", hashSecret);
  const signed   = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return signed === vnp_SecureHash && params.vnp_ResponseCode === "00";
};
