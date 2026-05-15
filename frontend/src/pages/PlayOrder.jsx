// frontend/src/pages/PlayOrder.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import useShopContext from "../hooks/useShopContext";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import ProductRow from "../components/ProductRow";
import AddressForm from "../components/AddressForm";
import {
  previewOrder,
  createCodOrder,
  createStripeOrder,
} from "../api/v3/orders";
import { saveAddress } from "../api/v3/addresses";
import axios from "axios";

const PlaceOrder = () => {
  const location = useLocation();
  const { navigate, backendUrl, cartItems, user } = useShopContext();
  const queryClient = useQueryClient();

  const selectedCartItems =
    location.state?.selectedCartItems || Object.values(cartItems);

  // ── Address state (fully reactive — derived from user.addresses via useQuery)
  const addresses = user?.addresses || [];
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Sync selectedAddress when addresses load (profile may arrive after mount)
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0] || null;
      setSelectedAddress(def);
    }
  }, [addresses, selectedAddress]);

  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // ── Payment ──────────────────────────────────────────────────────────
  const [method, setMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);

  // ── Preview ──────────────────────────────────────────────────────────
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Preview when address changes or items change ─────────────────────
  const handlePreview = useCallback(async () => {
    if (!selectedAddress?._id) return;
    const items = selectedCartItems.map((item) => ({
      product: item.id,
      quantity: item.quantity,
    }));
    if (items.length === 0) return;
    setPreviewLoading(true);
    try {
      const res = await previewOrder({
        addressId: selectedAddress._id,
        orderItems: items,
      });
      if (res.data.success) {
        setPreview(res.data.data);
      } else {
        toast.error(res.data.message || "Không thể tính phí vận chuyển");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Lỗi tính phí vận chuyển"
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedAddress, selectedCartItems]);

  useEffect(() => {
    handlePreview();
  }, [handlePreview]);

  // ── Save address ─────────────────────────────────────────────────────
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
        // Switch from add-form back to the address list inside the popup
        setShowAddForm(false);

        // Optimistically update profile cache so UI refreshes immediately
        const currentProfile = queryClient.getQueryData(["profile"]);
        if (currentProfile) {
          queryClient.setQueryData(["profile"], {
            ...currentProfile,
            addresses: [...(currentProfile.addresses || []), newAddr],
          });
        }
        // Also schedule background refetch
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        // Auto-select the newly created address
        if (newAddr) setSelectedAddress(newAddr);
      } else {
        toast.error(res.data.message || "Không thể lưu địa chỉ");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể lưu địa chỉ"
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // ── Place order ──────────────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedAddress) {
      toast.warning("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    setPlacing(true);

    const orderItems = selectedCartItems.map((item) => ({
      product: item.id,
      quantity: item.quantity,
    }));

    try {
      if (method === "cod") {
        const res = await createCodOrder({
          addressId: selectedAddress._id,
          orderItems,
        });
        if (!res.data.success) {
          if (res.data.errorCode === "EMAIL_NOT_VERIFIED") {
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          } else {
            toast.error(res.data.message || "Đặt hàng thất bại");
          }
          return;
        }
        toast.success(res.data.message || "Đặt hàng thành công!");
        queryClient.setQueryData(["cart"], {});
        navigate("/orders");

      } else if (method === "stripe") {
        const res = await createStripeOrder({
          addressId: selectedAddress._id,
          orderItems,
          successUrl: window.location.origin + "/orders",
          cancelUrl: window.location.origin + "/place-order",
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
          if (res.data.code === "EMAIL_NOT_VERIFIED") {
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          } else {
            toast.error(res.data.message);
          }
          return;
        }
        window.location.replace(res.data.data.payUrl);

      } else if (method === "vnpay") {
        const res = await axios.post(
          backendUrl + "/api/orders/vnpay",
          { addressId: selectedAddress._id, orderItems },
          { withCredentials: true }
        );
        if (!res.data.success) {
          if (res.data.code === "EMAIL_NOT_VERIFIED") {
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          } else {
            toast.error(res.data.message);
          }
          return;
        }
        window.location.replace(res.data.data.payUrl);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Lỗi đặt hàng"
      );
    } finally {
      setPlacing(false);
    }
  };

  // ── Compute totals ───────────────────────────────────────────────────
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = preview?.shippingFee ?? 20000;
  const welcomeDiscount = preview?.welcomeDiscount ?? 0;
  const discount = preview?.discount ?? 0;
  const totalDiscount = welcomeDiscount + discount;
  const total = preview?.total ?? subtotal + shippingFee;
  const estimatedDate = preview?.estimatedDeliveryDate || null;

  if (selectedCartItems.length === 0) {
    return (
      <div className="border-t pt-14 pb-20 px-4 text-center">
        <Title text1="Đặt Hàng" text2="" />
        <div className="py-16 bg-slate-50 rounded-2xl border border-slate-200 mt-6">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg font-semibold text-slate-600">Không có sản phẩm để đặt</p>
          <button
            onClick={() => navigate("/collection")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-5 sm:pt-10 pb-20 bg-gradient-to-b from-white via-slate-50/30 to-white">
      <div className="text-2xl mb-8">
        <Title text1="Đặt Hàng" text2="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column: products + address ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">
              Sản phẩm ({selectedCartItems.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {selectedCartItems.map((item) => (
                <div key={item.id} className="py-3">
                  <ProductRow
                    image={item.image}
                    name={item.name}
                    productId={item.id}
                    price={item.price}
                    quantity={item.quantity}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
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
                onClick={() => {
                  setShowAddForm(false);
                  setShowAddressPopup(true);
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thay đổi
              </button>
            </div>

            {selectedAddress ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">{selectedAddress.fullName}</span>
                  {selectedAddress.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{selectedAddress.phone}</p>
                <p className="text-sm text-slate-600">
                  {selectedAddress.street}, {selectedAddress.wardName || selectedAddress.ward}, {selectedAddress.districtName || selectedAddress.district}, {selectedAddress.provinceName || selectedAddress.province}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-xl">
                <p className="text-slate-500 mb-3">Chưa có địa chỉ giao hàng</p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setShowAddressPopup(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  + Thêm địa chỉ mới
                </button>
              </div>
            )}
          </div>

          {/* Welcome discount banner */}
          {welcomeDiscount > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  Giảm 20% cho đơn hàng đầu tiên!
                </p>
                <p className="text-sm text-green-700">
                  Bạn được giảm {welcomeDiscount.toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>
          )}

          {/* Shipping preview */}
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
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chi tiết đơn hàng
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="font-mono">{subtotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-mono">{shippingFee.toLocaleString("vi-VN")} ₫</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-mono">-{totalDiscount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
                {estimatedDate && (
                  <div className="flex justify-between text-blue-600 pt-1">
                    <span>Dự kiến giao:</span>
                    <span>{new Date(estimatedDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
                  <span>Tổng cộng:</span>
                  <span className="text-indigo-600 font-mono">{total.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: payment + action ──────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 sticky top-24 shadow-sm">
            <CartTotal
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
              discount={totalDiscount}
            />

            {/* Payment methods */}
            <div className="mt-5 mb-6">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                Phương thức thanh toán
              </h4>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "cod"
                      ? "border-indigo-500 bg-white shadow-sm"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={method === "cod"}
                    onChange={() => setMethod("cod")}
                    className="w-4 h-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">Thanh toán khi nhận hàng (COD)</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "stripe"
                      ? "border-indigo-500 bg-white shadow-sm"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={method === "stripe"}
                    onChange={() => setMethod("stripe")}
                    className="w-4 h-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">Thẻ quốc tế (Stripe)</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "momo"
                      ? "border-indigo-500 bg-white shadow-sm"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={method === "momo"}
                    onChange={() => setMethod("momo")}
                    className="w-4 h-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">Ví MoMo</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "vnpay"
                      ? "border-indigo-500 bg-white shadow-sm"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="vnpay"
                    checked={method === "vnpay"}
                    onChange={() => setMethod("vnpay")}
                    className="w-4 h-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">VNPay</span>
                </label>
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

      {/* ── Address selection popup ──────────────────────────────────── */}
      {showAddressPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-900">
                {showAddForm ? "Thêm địa chỉ mới" : "Chọn địa chỉ giao hàng"}
              </h3>
              <button
                onClick={() => {
                  setShowAddressPopup(false);
                  setShowAddForm(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xl cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {showAddForm ? (
                <AddressForm
                  onSubmit={handleSaveAddress}
                  onCancel={() => setShowAddForm(false)}
                  saving={savingAddress}
                />
              ) : (
                <>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-slate-500 mb-2">Chưa có địa chỉ nào</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="text-indigo-600 font-medium text-sm hover:text-indigo-700 cursor-pointer"
                      >
                        + Thêm địa chỉ mới
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            setShowAddressPopup(false);
                          }}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddress?._id === addr._id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mt-0.5">{addr.phone}</p>
                              <p className="text-sm text-slate-600 mt-0.5">
                                {addr.street}, {addr.wardName || addr.ward}, {addr.districtName || addr.district}, {addr.provinceName || addr.province}
                              </p>
                            </div>
                            {selectedAddress?._id === addr._id && (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-4 w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      + Thêm địa chỉ mới
                    </button>
                  )}
                </>
              )}
            </div>

            {!showAddForm && (
              <div className="border-t p-4 flex justify-end bg-slate-50 rounded-b-2xl">
                <button
                  onClick={() => setShowAddressPopup(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
