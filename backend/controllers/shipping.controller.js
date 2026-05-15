import Product from "../models/Product.js";
import shippingProvider from "../config/shipping.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";

/**
 * Get estimated delivery time to user's default address.
 * GET /api/v3/shipping/eta
 */
export const getEta = async (req, res) => {
  const user = req.user;
  const addr = user.addresses.find(a => a.isDefault) || user.addresses[0];
  if (!addr) throw new AppError("Vui lòng thêm địa chỉ giao hàng", 400, "NO_ADDRESS");
  if (!addr.districtId || !addr.wardCode) {
    throw new AppError("Địa chỉ chưa có mã quận/huyện hoặc phường/xã", 400, "ADDRESS_MISSING_CODES");
  }

  let eta = null;
  try {
    const etaResult = await shippingProvider.estimateDeliveryTime(0, addr.districtId, addr.wardCode);
    if (etaResult?.success) eta = etaResult.data;
  } catch {
    // ETA is non-critical
  }

  ApiResponse.success("ETA estimated", {
    estimatedDeliveryTime: eta,
    address: {
      fullName: addr.fullName,
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
    },
  }).send(res);
};

/**
 * Estimate shipping fee for a set of items to the user's address.
 * Uses default address if addressId not provided.
 *
 * POST /api/v3/shipping/estimate-fee
 * Body: { items: [{ product, quantity }], addressId?: string }
 */
export const estimateFee = async (req, res) => {
  const { items, addressId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("Vui lòng cung cấp danh sách sản phẩm", 400, "MISSING_ITEMS");
  }

  // Resolve address
  const user = req.user;
  let addr;
  if (addressId) {
    addr = user.addresses.id(addressId);
    if (!addr) throw new AppError("Không tìm thấy địa chỉ", 404, "ADDRESS_NOT_FOUND");
  } else {
    addr = user.addresses.find(a => a.isDefault) || user.addresses[0];
    if (!addr) throw new AppError("Vui lòng thêm địa chỉ giao hàng", 400, "NO_ADDRESS");
  }

  if (!addr.districtId || !addr.wardCode) {
    throw new AppError(
      "Địa chỉ chưa có mã quận/huyện hoặc phường/xã để tính phí. Vui lòng cập nhật lại địa chỉ.",
      400,
      "ADDRESS_MISSING_CODES"
    );
  }

  // Resolve products
  const productIds = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price specifications")
    .lean({ virtuals: true });

  if (products.length !== new Set(productIds).size) {
    throw new AppError("Một hoặc nhiều sản phẩm không tồn tại", 400, "INVALID_PRODUCT");
  }

  // Build GHN items array
  const ghnItems = [];
  let totalWeight = 0;
  let maxLength = 6, maxWidth = 6, maxHeight = 6;

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.product.toString());
    if (!product) continue;

    ghnItems.push({
      name: product.name,
      quantity: item.quantity || 1,
    });

    // Parse specifications for dimensions
    for (const spec of (product.specifications || [])) {
      const v = Number(spec.value);
      if (isNaN(v)) continue;
      if (spec.key === "weight") totalWeight += v * (item.quantity || 1);
      if (spec.key === "length") maxLength = Math.max(maxLength, v);
      if (spec.key === "width") maxWidth = Math.max(maxWidth, v);
      if (spec.key === "height") maxHeight = Math.max(maxHeight, v);
    }
  }

  // GHN requires minimum values
  const weight = Math.max(totalWeight, 10);
  const length = Math.min(Math.max(maxLength, 6), 200);
  const width = Math.min(Math.max(maxWidth, 6), 200);
  const height = Math.min(Math.max(maxHeight, 6), 200);

  // Call GHN fee API
  let feeResult;
  try {
    feeResult = await shippingProvider.calcShippingFee(
      2,       // serviceType (2 = standard)
      0,       // shopIdx (first shop)
      addr.wardCode,
      addr.districtId,
      weight,
      length,
      width,
      height,
      ghnItems
    );
  } catch (err) {
    throw new AppError("Không thể tính phí vận chuyển. Vui lòng thử lại sau.", 502, "SHIPPING_API_ERROR");
  }

  if (!feeResult || !feeResult.success) {
    throw new AppError(
      feeResult?.message || "Không thể tính phí vận chuyển",
      400,
      "FEE_CALC_FAILED"
    );
  }

  // Get estimated delivery time as well
  let eta = null;
  try {
    const etaResult = await shippingProvider.estimateDeliveryTime(0, addr.districtId, addr.wardCode);
    if (etaResult?.success) eta = etaResult.data;
  } catch {
    // ETA is non-critical
  }

  ApiResponse.success("Shipping fee estimated", {
    shippingFee: feeResult.data?.total || feeResult.data?.serviceFee || 0,
    serviceFee: feeResult.data?.serviceFee || 0,
    total: feeResult.data?.total || 0,
    weight,
    dimensions: { length, width, height },
    estimatedDeliveryTime: eta,
    address: {
      fullName: addr.fullName,
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
    },
  }).send(res);
};
