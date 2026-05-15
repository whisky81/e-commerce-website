// frontend/src/pages/PlaceOrderByProductId.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useShopContext from "../hooks/useShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import {
  previewOrder,
  createCodOrder,
  createStripeOrder,
} from "../api/v3/orders";
import { saveAddress } from "../api/v3/addresses";
import { fetchProduct } from "../api/products";
import AddressForm from "../components/AddressForm";
import axios from "axios";

const PlaceOrderByProductId = () => {
  const { productId } = useParams();
  const { navigate, backendUrl, user } = useShopContext();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Address (fully reactive — derived from profile via useQuery in useAuth)
  const addresses = user?.addresses || [];
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Auto-select default address when addresses become available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find((a) => a.isDefault) || addresses[0] || null);
    }
  }, [addresses, selectedAddress]);

  // Preview
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Payment
  const [method, setMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);

  // Load product
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchProduct(productId);
        if (res.data.success) setProduct(res.data.data);
        else throw new Error(res.data.message);
      } catch {
        toast.error("Không thể tải sản phẩm");
      } finally {
        setLoadingProduct(false);
      }
    };
    load();
  }, [productId]);

  // Preview
  useEffect(() => {
    if (!selectedAddress?._id || !product) return;
    const run = async () => {
      setPreviewLoading(true);
      try {
        const res = await previewOrder({
          addressId: selectedAddress._id,
          orderItems: [{ product: product._id || productId, quantity }],
        });
        if (res.data.success) setPreview(res.data.data);
      } catch {
        // preview failure is non-critical
      } finally {
        setPreviewLoading(false);
      }
    };
    run();
  }, [selectedAddress, product, quantity, productId]);

  const handleSaveAddress = async (formData) => {
    setSavingAddress(true);
    try {
      const res = await saveAddress({
        fullName: formData.fullName,
        phone: formData.phone,
        street: formData.street,
        provinceId: formData.provinceId,
        districtId: formData.districtId,
        wardCode: formData.wardCode,
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        isDefault: formData.isDefault || false,
        lat: formData.lat ?? null,
        lng: formData.lng ?? null,
        placeId: formData.placeId ?? null,
      });
      if (res.data.success) {
        const newAddr = res.data.data;
        toast.success("Đã lưu địa chỉ mới");
        setShowAddForm(false);
        setShowAddressPopup(false);
        // Optimistically update profile cache so UI refreshes immediately
        const currentProfile = queryClient.getQueryData(["profile"]);
        if (currentProfile) {
          queryClient.setQueryData(["profile"], {
            ...currentProfile,
            addresses: [...(currentProfile.addresses || []), newAddr],
          });
        }
        // Schedule background refetch
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        // Auto-select the newly created address
        if (newAddr) setSelectedAddress(newAddr);
      } else {
        toast.error(res.data.message || "Không thể lưu địa chỉ");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu địa chỉ");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.warning("Vui lòng chọn địa chỉ"); return; }
    setPlacing(true);
    const orderItems = [{ product: product?._id || productId, quantity }];
    try {
      if (method === "cod") {
        const res = await createCodOrder({ addressId: selectedAddress._id, orderItems });
        if (!res.data.success) {
          if (res.data.errorCode === "EMAIL_NOT_VERIFIED") {
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          } else {
            toast.error(res.data.message || "Đặt hàng thất bại");
          }
          return;
        }
        toast.success("Đặt hàng thành công!");
        navigate("/orders");
      } else if (method === "stripe") {
        const res = await createStripeOrder({
          addressId: selectedAddress._id,
          orderItems,
          successUrl: window.location.origin + "/orders",
          cancelUrl: window.location.origin + "/place-order/" + productId,
        });
        if (!res.data.success) {
          if (res.data.errorCode === "EMAIL_NOT_VERIFIED") {
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          } else {
            toast.error(res.data.message || "Đặt hàng thất bại");
          }
          return;
        }
        window.location.replace(res.data.data.sessionUrl);
      } else if (method === "momo") {
        const res = await axios.post(
          backendUrl + "/api/orders/momo",
          { addressId: selectedAddress._id, orderItems },
          { withCredentials: true }
        );
        if (!res.data.success) {
          toast.error(res.data.message); return;
        }
        window.location.replace(res.data.data.payUrl);
      } else if (method === "vnpay") {
        const res = await axios.post(
          backendUrl + "/api/orders/vnpay",
          { addressId: selectedAddress._id, orderItems },
          { withCredentials: true }
        );
        if (!res.data.success) {
          toast.error(res.data.message); return;
        }
        window.location.replace(res.data.data.payUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đặt hàng");
    } finally {
      setPlacing(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="border-t pt-14 pb-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="border-t pt-14 pb-20 text-center">
        <Title text1="Không Tìm Thấy" text2="Sản Phẩm" />
        <button onClick={() => navigate("/collection")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
          Về trang sản phẩm
        </button>
      </div>
    );
  }

  const subtotal = (product.price || 0) * quantity;
  const shippingFee = preview?.shippingFee ?? 20000;
  const discount = (preview?.welcomeDiscount ?? 0) + (preview?.discount ?? 0);
  const total = preview?.total ?? subtotal + shippingFee;

  return (
    <div className="border-t pt-5 sm:pt-10 pb-20 bg-gradient-to-b from-white via-slate-50/30 to-white">
      <div className="text-2xl mb-8">
        <Title text1="Mua Ngay" text2="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex gap-4">
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-xl border border-slate-200"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">{product.name}</h3>
                <p className="text-indigo-600 font-bold mt-1">
                  {(product.price || 0).toLocaleString("vi-VN")} ₫
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-slate-600">Số lượng:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >−</button>
                    <span className="w-10 text-center border-x border-slate-300 py-1 text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      disabled={quantity >= 99}
                      className="px-3 py-1 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Địa chỉ giao hàng
              </h3>
              <button
                onClick={() => { setShowAddressPopup(true); setShowAddForm(false); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                Thay đổi
              </button>
            </div>
            {selectedAddress ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="font-semibold text-slate-900">{selectedAddress.fullName}</p>
                <p className="text-sm text-slate-600">{selectedAddress.phone}</p>
                <p className="text-sm text-slate-600">
                  {selectedAddress.street}, {selectedAddress.wardName || selectedAddress.ward}, {selectedAddress.districtName || selectedAddress.district}, {selectedAddress.provinceName || selectedAddress.province}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-xl">
                <p className="text-slate-500 mb-3">Chưa có địa chỉ giao hàng</p>
                <button
                  onClick={() => { setShowAddressPopup(true); setShowAddForm(true); }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  + Thêm địa chỉ mới
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-300 border-t-indigo-600" />
                Đang tính phí vận chuyển...
              </div>
            </div>
          )}

          {preview && !previewLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900 mb-3">Chi tiết đơn hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="font-mono">{subtotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-mono">{shippingFee.toLocaleString("vi-VN")} ₫</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-mono">-{discount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
                {preview?.estimatedDeliveryDate && (
                  <div className="flex justify-between text-blue-600">
                    <span>Dự kiến giao:</span>
                    <span>{new Date(preview.estimatedDeliveryDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-indigo-600 font-mono">{total.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 sticky top-24 shadow-sm">
            <CartTotal subtotal={subtotal} shippingFee={shippingFee} total={total} discount={discount} />

            {/* Payment methods */}
            <div className="mt-5 mb-6">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Phương thức thanh toán</h4>
              <div className="space-y-2">
                {["cod", "stripe", "momo", "vnpay"].map((m) => (
                  <label key={m}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      method === m ? "border-indigo-500 bg-white shadow-sm" : "border-transparent hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio" name="payment" value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="w-4 h-4 text-indigo-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {m === "cod" && "Thanh toán khi nhận hàng (COD)"}
                      {m === "stripe" && "Thẻ quốc tế (Stripe)"}
                      {m === "momo" && "Ví MoMo"}
                      {m === "vnpay" && "VNPay"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddress}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {placing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt hàng"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Address popup (same as PlayOrder) */}
      {showAddressPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-900">
                {showAddForm ? "Thêm địa chỉ mới" : "Chọn địa chỉ giao hàng"}
              </h3>
              <button
                onClick={() => { setShowAddressPopup(false); setShowAddForm(false); }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xl cursor-pointer transition-colors"
              >×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {showAddForm ? (
                <AddressForm onSubmit={handleSaveAddress} onCancel={() => setShowAddForm(false)} saving={savingAddress} />
              ) : (
                <>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500 mb-2">Chưa có địa chỉ nào</p>
                      <button onClick={() => setShowAddForm(true)}
                        className="text-indigo-600 font-medium text-sm hover:text-indigo-700 cursor-pointer">
                        + Thêm địa chỉ mới
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr._id}
                          onClick={() => { setSelectedAddress(addr); setShowAddressPopup(false); }}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddress?._id === addr._id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-900">{addr.fullName}</p>
                              <p className="text-sm text-slate-500">{addr.phone}</p>
                              <p className="text-sm text-slate-600">
                                {addr.street}, {addr.wardName || addr.ward}, {addr.districtName || addr.district}, {addr.provinceName || addr.province}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {addresses.length > 0 && (
                    <button onClick={() => setShowAddForm(true)}
                      className="mt-4 w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 transition-colors cursor-pointer">
                      + Thêm địa chỉ mới
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrderByProductId;
