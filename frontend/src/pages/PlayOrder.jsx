// frontend/src/pages/PlayOrder.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import useShopContext from "../hooks/useShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import ProductRow from "../components/ProductRow";
import AddressForm from "../components/AddressForm";

const EMPTY_ADDR = {
  fullName: "", phone: "", street: "", ward: "",
  province: "", lat: null, lng: null, placeId: null,
};

const PlaceOrder = () => {
  const location = useLocation();
  const { navigate, backendUrl, cartItems, setCartItems, user, my } = useShopContext();

  // Items passed from Cart.jsx (only the ones the user selected)
  const selectedCartItems = location.state?.selectedCartItems || Object.values(cartItems);

  const [method,             setMethod]             = useState("cod");
  const [selectedAddress,    setSelectedAddress]    = useState(null);
  const [showAddressPopup,   setShowAddressPopup]   = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [placing,            setPlacing]            = useState(false);

  useEffect(() => {
    if (user?.addresses?.length) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [user]);

  const handleAddAddress = async (formData) => {
    try {
      const res = await axios.post(backendUrl + "/api/users/addresses", formData, { withCredentials: true });
      if (!res.data.success) throw new Error(res.data.message);
      toast.success("Đã thêm địa chỉ mới");
      setShowAddAddressForm(false);
      setShowAddressPopup(false);
      await my();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!selectedAddress) { toast.warning("Vui lòng chọn địa chỉ giao hàng"); return; }
    setPlacing(true);

    // Only order the selected items
    const shippingAddress = {
      fullName: selectedAddress.fullName,
      phone:    selectedAddress.phone,
      street:   selectedAddress.street,
      ward:     selectedAddress.ward,
      province: selectedAddress.province,
    };
    const orderItems = selectedCartItems.map(item => ({ product: item.id, quantity: item.quantity }));

    try {
      let response;

      if (method === "cod") {
        response = await axios.post(backendUrl + "/api/orders/place", { shippingAddress, orderItems }, { withCredentials: true });
        if (response.status === 401) { navigate("/login"); return; }
        if (!response.data.success) {
          if (response.data.code === "EMAIL_NOT_VERIFIED")
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng. Kiểm tra hộp thư của bạn.");
          else
            toast.error(response.data.message);
          return;
        }
        toast.success(response.data.message);
        setCartItems({});
        navigate("/orders");

      } else if (method === "stripe") {
        response = await axios.post(backendUrl + "/api/orders/stripe", { shippingAddress, orderItems }, { withCredentials: true });
        if (!response.data.success) {
          if (response.data.code === "EMAIL_NOT_VERIFIED")
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          else
            toast.error(response.data.message);
          return;
        }
        window.location.replace(response.data.data.session_url);

      } else if (method === "momo") {
        response = await axios.post(
          backendUrl + "/api/orders/momo",
          { addressId: selectedAddress._id, orderItems },
          { withCredentials: true }
        );
        if (!response.data.success) {
          if (response.data.code === "EMAIL_NOT_VERIFIED")
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          else
            toast.error(response.data.message);
          return;
        }
        window.location.replace(response.data.data.payUrl);

      } else if (method === "vnpay") {
        response = await axios.post(
          backendUrl + "/api/orders/vnpay",
          { addressId: selectedAddress._id, orderItems },
          { withCredentials: true }
        );
        if (!response.data.success) {
          if (response.data.code === "EMAIL_NOT_VERIFIED")
            toast.error("⚠️ Vui lòng xác nhận email trước khi đặt hàng.");
          else
            toast.error(response.data.message);
          return;
        }
        window.location.replace(response.data.data.payUrl);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col lg:flex-row justify-between gap-8 pt-5 sm:pt-14 min-h-[80vh] border-t px-4 md:px-8 max-w-7xl mx-auto"
    >
      {/* Left */}
      <div className="flex flex-col gap-6 w-full lg:w-2/3">

        {/* Products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><Title text1="Thông Tin" text2="Sản Phẩm" /></div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {selectedCartItems.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3 hover:shadow-sm transition-shadow">
                <ProductRow image={item.image} name={item.name} productId={item.id} price={item.price} quantity={item.quantity} />
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4"><Title text1="Địa Chỉ" text2="Giao Hàng" /></div>
          {selectedAddress ? (
            <div className="rounded-xl p-4" style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold" style={{ color: "#1E1B4B" }}>{selectedAddress.fullName}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#4F46E5" }}>{selectedAddress.phone}</p>
                  <p className="text-sm mt-1 text-gray-600">
                    {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.province}
                  </p>
                  {selectedAddress.lat && selectedAddress.lng && (
                    <a href={`https://www.openstreetmap.org/?mlat=${selectedAddress.lat}&mlon=${selectedAddress.lng}#map=16/${selectedAddress.lat}/${selectedAddress.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs mt-1.5 inline-flex items-center gap-1 hover:underline"
                      style={{ color: "#6366F1" }}>
                      📍 Xem trên bản đồ
                    </a>
                  )}
                </div>
                <button type="button" onClick={() => setShowAddressPopup(true)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: "#4F46E5", color: "#fff" }}>
                  Thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 rounded-xl" style={{ background: "#F5F4FF", border: "2px dashed #DDD6FE" }}>
              <p className="text-gray-500 mb-3">Chưa có địa chỉ giao hàng</p>
              <button type="button" onClick={() => setShowAddressPopup(true)}
                className="px-5 py-2 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>
                Chọn địa chỉ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24 space-y-6">
          {/*
            FIX: pass `items={selectedCartItems}` so CartTotal computes the total
            for the purchased subset only, not the entire cart.
          */}
          <CartTotal items={selectedCartItems} />

          <div>
            <Title text1="Phương Thức" text2="Thanh Toán" />
            <div className="flex flex-col gap-3 mt-3">
              {[
                {
                  key: "stripe",
                  label: "Thẻ quốc tế (Stripe)",
                  icon: <img src={assets.stripe_logo} className="h-5" alt="stripe" />,
                },
                {
                  key: "momo",
                  label: "Ví MoMo",
                  icon: (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "#A50064" }}>M</div>
                  ),
                },
                {
                  key: "vnpay",
                  label: "VNPay",
                  icon: (
                    <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "#005BAA" }}>VN</div>
                  ),
                },
                {
                  key: "cod",
                  label: "Thanh toán khi nhận hàng (COD)",
                  icon: <span className="text-xl">💵</span>,
                },
              ].map(({ key, label, icon }) => (
                <div
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    method === key
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    method === key ? "border-indigo-500" : "border-gray-300"
                  }`}>
                    {method === key && (
                      <div className="w-3 h-3 rounded-full" style={{ background: "#4F46E5" }} />
                    )}
                  </div>
                  {icon}
                  <span className="font-medium text-gray-700 text-sm flex-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedAddress || placing}
            className="w-full py-4 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : selectedAddress ? "🛍️ Đặt hàng ngay" : "Chọn địa chỉ để tiếp tục"}
          </button>
        </div>
      </div>

      {/* Address popup */}
      {showAddressPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b"
              style={{ background: "linear-gradient(135deg,#F5F4FF,#EEF2FF)" }}>
              <h3 className="text-base font-bold" style={{ color: "#1E1B4B" }}>
                {showAddAddressForm ? "➕ Thêm địa chỉ mới" : "📍 Chọn địa chỉ giao hàng"}
              </h3>
              <button type="button"
                onClick={() => { setShowAddressPopup(false); setShowAddAddressForm(false); }}
                className="w-8 h-8 rounded-full hover:bg-indigo-100 transition-colors flex items-center justify-center text-gray-500 text-xl">
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {!showAddAddressForm ? (
                <>
                  {user?.addresses?.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Chưa có địa chỉ. Thêm địa chỉ mới.</p>
                  ) : (
                    <div className="space-y-3">
                      {user?.addresses?.map(address => (
                        <div key={address._id}
                          onClick={() => { setSelectedAddress(address); setShowAddressPopup(false); }}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddress?._id === address._id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-200"
                          }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{address.fullName}</p>
                                {address.isDefault && (
                                  <span className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "#EEF2FF", color: "#4F46E5" }}>Mặc định</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">{address.phone}</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {address.street}, {address.ward}, {address.province}
                              </p>
                            </div>
                            {selectedAddress?._id === address._id && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: "#4F46E5" }}>
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
                  <button type="button" onClick={() => setShowAddAddressForm(true)}
                    className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: "2px dashed #DDD6FE", color: "#4F46E5", background: "#F5F4FF" }}>
                    + Thêm địa chỉ mới
                  </button>
                </>
              ) : (
                <AddressForm 
                  onSubmit={handleAddAddress}
                  onCancel={() => setShowAddAddressForm(false)}
                />
              )}
            </div>

            {!showAddAddressForm && (
              <div className="border-t p-4 flex justify-end gap-3" style={{ background: "#F9FAFB" }}>
                <button type="button" onClick={() => setShowAddressPopup(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
};

export default PlaceOrder;