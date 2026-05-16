// frontend/src/pages/Orders.jsx
import React, { useState, useEffect, useCallback } from "react";
import useShopContext from "../hooks/useShopContext";
import Title from "../components/Title";
import { toast } from "react-toastify";
import axios from "axios";
import Address from "../components/Address";
import ProductRow from "../components/ProductRow";
import { formatPrice, formatDate } from "../utils/formats";

const orderDisplayTotal = (o) => {
  if (!o || typeof o !== "object") return 0;
  const v = o.totalFee ?? o.totalPrice;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const sub = o.fee?.subtotal ?? o.itemsPrice ?? 0;
  const disc = o.fee?.discount ?? 0;
  const ship = o.shipping?.fee ?? o.shippingPrice ?? 0;
  return sub - disc + ship;
};
const orderSubtotal = (o) => o?.fee?.subtotal ?? o?.itemsPrice ?? 0;
const orderShippingFee = (o) => o?.shipping?.fee ?? o?.shippingPrice ?? 0;
const orderDiscountAmt = (o) => {
  if (!o) return 0;
  if (o.fee?.discount != null && o.fee.discount > 0) return o.fee.discount;
  return o.welcomeDiscountAmount ?? 0;
};
const orderHasDiscount = (o) => orderDiscountAmt(o) > 0;
const payMethodKey = (o) => o.payment?.method ?? o.paymentMethod;
const isOrderPaid = (o) => (o.payment?.status === "paid") || Boolean(o.isPaid);
const orderCodeLabel = (o) =>
  o?.code ? `#${o.code}` : o?._id ? `#${String(o._id).slice(-8)}` : "#—";

const paymentMethodLabel = (method) =>
({
  cod: "Thanh toán khi nhận hàng",
  bank: "Thẻ quốc tế (Stripe)",
  stripe: "Thẻ quốc tế (Stripe)",
  momo: "Ví MoMo",
  vnpay: "VNPay",
}[method] || method || "—");

const Orders = () => {
  const { backendUrl, isAuthenticated, navigate } = useShopContext();
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelling,    setCancelling]    = useState(null);

  // ─── Support modal state ───────────────────────────────────────────────────
  const [supportOrder,   setSupportOrder]   = useState(null);
  const [supportMsg,     setSupportMsg]     = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  const fetchOrdersData = useCallback(async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/orders/me", { withCredentials: true });
      if (response.status === 401) { navigate("/login"); return; }
      if (!response.data.success) throw new Error(response.data.message);
      const raw = response.data.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setOrders(list.filter(Boolean));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, backendUrl, navigate]);

  useEffect(() => {
    if (isAuthenticated) fetchOrdersData();
  }, [isAuthenticated, fetchOrdersData]);

  // ─── Cancel order ─────────────────────────────────────────────────────────
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    setCancelling(orderId);
    try {
      const res = await axios.patch(`${backendUrl}/api/orders/${orderId}/cancel`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchOrdersData();
      } else throw new Error(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setCancelling(null);
    }
  };

  // ─── Contact support ──────────────────────────────────────────────────────
  const handleSendSupport = async () => {
    if (!supportMsg.trim()) { toast.warning("Vui lòng nhập nội dung hỗ trợ"); return; }
    setSendingSupport(true);
    try {
      const res = await axios.post(`${backendUrl}/api/orders/${supportOrder._id}/contact`, { message: supportMsg }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        setSupportOrder(null);
        setSupportMsg("");
      } else throw new Error(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setSendingSupport(false);
    }
  };

  const getStatusInfo = (status) => ({
    pending:   { color: "bg-yellow-500", text: "Chờ xác nhận",  badge: "bg-yellow-100 text-yellow-800" },
    confirmed: { color: "bg-blue-500",   text: "Đã xác nhận",   badge: "bg-blue-100 text-blue-800" },
    shipping:  { color: "bg-purple-500", text: "Đang giao hàng",badge: "bg-purple-100 text-purple-800" },
    delivered: { color: "bg-green-500",  text: "Đã giao hàng",  badge: "bg-green-100 text-green-800" },
    cancelled: { color: "bg-red-500",    text: "Đã hủy",        badge: "bg-red-100 text-red-800" },
  }[status] || { color: "bg-gray-500", text: status, badge: "bg-gray-100 text-gray-800" });

  const getPaymentMethodText = (order) => paymentMethodLabel(payMethodKey(order));

  if (loading) {
    return (
      <div className="border-t pt-16">
        <div className="text-2xl mb-8"><Title text1="Đơn" text2="hàng" /></div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-16">
      <div className="text-2xl mb-8">
        <Title text1="Đơn" text2="hàng của tôi" />
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
          <button onClick={() => navigate("/collection")}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            if (!order?._id) return null;
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order._id} className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 hover:bg-gray-100 transition"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono">{orderCodeLabel(order)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
                      {statusInfo.text}
                    </span>
                    {(order.welcomeDiscount || orderHasDiscount(order)) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg> Ưu đãi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                    <span className="font-bold text-blue-600">{formatPrice(orderDisplayTotal(order))}</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform text-gray-400 ${expandedOrder === order._id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Order Details */}
                {expandedOrder === order._id && (
                  <div className="p-4 border-t">
                    {/* Items */}
                    <h3 className="font-semibold text-lg mb-3">Sản phẩm đã đặt</h3>
                    <div className="space-y-3">
                      {(order.items ?? []).map((item, idx) => (
                        <ProductRow
                          key={idx}
                          image={item.image?.url || item.image} name={item.name}
                          productId={item.product} price={item.price} quantity={item.quantity}
                        />
                      ))}
                    </div>

                    {/* Welcome discount info */}
                    {orderHasDiscount(order) && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
                        <p className="text-emerald-700 font-medium">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg> Giảm giá / ưu đãi đã áp dụng – Tiết kiệm: {formatPrice(orderDiscountAmt(order))}
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Địa chỉ giao hàng</h3>
                        {order.shippingAddress ? (
                          <Address address={order.shippingAddress} isSelected={false} readOnly={true} />
                        ) : (
                          <p className="text-sm text-gray-500">Không có dữ liệu địa chỉ.</p>
                        )}
                      </div>

                      {/* Payment */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Thông tin thanh toán</h3>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phương thức:</span>
                            <span className="font-medium">{getPaymentMethodText(order)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Thanh toán:</span>
                            <span className={`font-semibold ${isOrderPaid(order) ? "text-green-600" : "text-red-600"}`}>
                              {isOrderPaid(order) ? "Đã thanh toán" : "Chưa thanh toán"}
                            </span>
                          </div>
                          <hr className="border-gray-200" />
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tạm tính:</span>
                            <span>{formatPrice(orderSubtotal(order))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phí vận chuyển:</span>
                            <span>{formatPrice(orderShippingFee(order))}</span>
                          </div>
                          {orderHasDiscount(order) && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Giảm giá / ưu đãi:</span>
                              <span>-{formatPrice(orderDiscountAmt(order))}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-base border-t pt-2">
                            <span>Tổng cộng:</span>
                            <span className="text-blue-600">{formatPrice(orderDisplayTotal(order))}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      {/* ✅ Hủy đơn hàng – chỉ hiện khi pending */}
                      {order.status === "pending" && (
                        <button
                          disabled={cancelling === order._id}
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {cancelling === order._id ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Đang hủy...
                            </span>
                          ) : "Hủy đơn hàng"}
                        </button>
                      )}

                      {/* ✅ Liên hệ hỗ trợ */}
                      <button
                        onClick={() => { setSupportOrder(order); setSupportMsg(""); }}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Liên hệ hỗ trợ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Support Modal */}
      {supportOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg inline-flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Liên hệ hỗ trợ</h3>
                <p className="text-sm text-gray-500 mt-0.5">Mã đơn: {orderCodeLabel(supportOrder)}</p>
              </div>
              <button
                onClick={() => setSupportOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-xl cursor-pointer"
              >×</button>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-700">
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Mô tả vấn đề của bạn, chúng tôi sẽ phản hồi qua email trong vòng 24 giờ.
            </div>

            <textarea
              rows={5}
              value={supportMsg}
              onChange={e => setSupportMsg(e.target.value)}
              placeholder="Ví dụ: Sản phẩm tôi nhận được bị lỗi / Tôi muốn đổi trả / ..."
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 resize-none transition"
            />

            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setSupportOrder(null)}
                className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSendSupport}
                disabled={sendingSupport}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
              >
                {sendingSupport ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi...
                  </span>
                ) : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;