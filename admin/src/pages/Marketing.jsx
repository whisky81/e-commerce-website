// admin/src/pages/Marketing.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchProducts } from "../api/products";
import { sendPromo as sendPromoApi, applyBulkDiscount, removeBulkDiscount } from "../api/marketing";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const Marketing = () => {
  const [tab,      setTab]      = useState("discount"); // 'discount' | 'email'
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Discount form
  const [discount,    setDiscount]    = useState(10);
  const [saleStartAt, setSaleStartAt] = useState("");
  const [saleEndAt,   setSaleEndAt]   = useState("");

  // Email form
  const [emailSubject, setEmailSubject] = useState("🔥 Ưu đãi đặc biệt từ ABC Shop!");
  const [promoCode,    setPromoCode]    = useState("");
  const [sending,      setSending]      = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 100 }).then(r => { if (r.data.success) setProducts(r.data.data); });
  }, []);

  const toggleSelect = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelected(selected.length === products.length ? [] : products.map(p => p._id));

  const applyDiscount = async () => {
    setLoading(true);
    try {
      const res = await applyBulkDiscount({
        productIds: selected.length ? selected : undefined,
        discount,
        saleStartAt: saleStartAt || undefined,
        saleEndAt:   saleEndAt   || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        // Cập nhật UI ngay lập tức
        setProducts(prev =>
          prev.map(p => {
            if (selected.length === 0 || selected.includes(p._id)) {
              return { ...p, discount, saleStartAt, saleEndAt };
            }
            return p;
          })
        );
        setSelected([]);
      } else throw new Error(res.data.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeDiscount = async () => {
    setLoading(true);
    try {
      const res = await removeBulkDiscount(selected);
      if (res.data.success) {
        toast.success(res.data.message);
        // Xóa badge discount khỏi UI ngay lập tức
        setProducts(prev =>
          prev.map(p => {
            if (selected.length === 0 || selected.includes(p._id)) {
              return { ...p, discount: 0, saleStartAt: null, saleEndAt: null };
            }
            return p;
          })
        );
        setSelected([]);
      } else throw new Error(res.data.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPromo = async () => {
    setSending(true);
    try {
      const res = await sendPromoApi({
        subject:    emailSubject,
        promoCode:  promoCode || undefined,
        productIds: selected.length ? selected : undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
      } else throw new Error(res.data.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const CARD = ({ children, style }) => (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#fff", border: "1.5px solid #DDD6FE", ...style }}
    >
      {children}
    </div>
  );

  const LBL = ({ children }) => (
    <label className="text-xs font-semibold mb-1 block" style={{ color: "#4F46E5" }}>
      {children}
    </label>
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1E1B4B" }}>
          Tiếp thị
        </h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Quản lý khuyến mãi và gửi email marketing
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "discount", label: "🏷️ Giảm giá hàng loạt" },
          { key: "email",    label: "✉️ Gửi email" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? "text-white shadow-lg"
                : "text-gray-600 bg-white border border-gray-200 hover:border-indigo-300"
            }`}
            style={tab === t.key ? { background: "linear-gradient(135deg,#4F46E5,#7C3AED)" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Product list panel */}
        <div className={tab === "discount" ? "" : "hidden lg:block"}>
          <CARD>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: "#1E1B4B" }}>
                📦 Chọn sản phẩm ({selected.length}/{products.length})
              </p>
              <button
                onClick={toggleAll}
                className="text-xs font-medium px-3 py-1 rounded-lg"
                style={{ background: "#EEF2FF", color: "#4F46E5" }}
              >
                {selected.length === products.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(p => (
                <div
                  key={p._id}
                  onClick={() => toggleSelect(p._id)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    selected.includes(p._id)
                      ? "ring-2 ring-indigo-400"
                      : "hover:bg-gray-50"
                  }`}
                  style={
                    selected.includes(p._id)
                      ? { background: "#EEF2FF" }
                      : { background: "#FAFAFF" }
                  }
                >
                  <img
                    src={p.images?.[0]?.url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1E1B4B" }}>
                      {p.name}
                    </p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      {fmt(p.price)}
                      {p.discount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
                          style={{ background: "#FEE2E2", color: "#EF4444" }}>
                          -{p.discount}%
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected.includes(p._id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selected.includes(p._id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CARD>
        </div>

        {/* Controls panel */}
        <div className="space-y-4">
          {/* Discount controls */}
          <div style={{ display: tab === "discount" ? "block" : "none" }}>
            <CARD>
              <p className="text-sm font-bold mb-4" style={{ color: "#1E1B4B" }}>
                🏷️ Áp dụng giảm giá
              </p>
              <div className="space-y-3">
                <div>
                  <LBL>Phần trăm giảm</LBL>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-16 px-2 py-1.5 text-center text-sm rounded-lg font-bold"
                      style={{ border: "1.5px solid #FDE68A", background: "#fff", color: "#92400E" }}
                    />
                    <span className="text-sm font-bold" style={{ color: "#92400E" }}>%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <LBL>Bắt đầu</LBL>
                    <input
                      type="datetime-local"
                      value={saleStartAt}
                      onChange={e => setSaleStartAt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg"
                      style={{ border: "1.5px solid #DDD6FE", background: "#fff" }}
                    />
                  </div>
                  <div>
                    <LBL>Kết thúc</LBL>
                    <input
                      type="datetime-local"
                      value={saleEndAt}
                      onChange={e => setSaleEndAt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg"
                      style={{ border: "1.5px solid #DDD6FE", background: "#fff" }}
                    />
                  </div>
                </div>
                <button
                  onClick={applyDiscount}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)" }}
                >
                  {loading ? "..." : `🔥 Áp dụng ${discount}% cho ${selected.length || "tất cả"}`}
                </button>
                <button
                  onClick={removeDiscount}
                  disabled={loading}
                  className="w-full py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#FEE2E2", color: "#EF4444" }}
                >
                  ✕ Xóa discount
                </button>
              </div>
            </CARD>
          </div>

          {/* Email panel */}
          <div style={{ display: tab === "email" ? "block" : "none" }}>
            <CARD>
              <p className="text-sm font-bold mb-4" style={{ color: "#1E1B4B" }}>
                ✉️ Gửi email marketing
              </p>
              <div className="space-y-3">
                <div>
                  <LBL>Tiêu đề email</LBL>
                  <input
                    type="text"
                    id="marketing-email-subject"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none focus:ring-2"
                    style={{
                      border: "1.5px solid #DDD6FE",
                      background: "#FAFAFF",
                      boxShadow: "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#4F46E5"; }}
                    onBlur={e => { e.target.style.borderColor = "#DDD6FE"; }}
                  />
                </div>
                <div>
                  <LBL>Mã giảm giá (tuỳ chọn)</LBL>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="VD: SALE20"
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl tracking-widest outline-none"
                    style={{ border: "1.5px solid #DDD6FE", background: "#FAFAFF" }}
                  />
                </div>
                <div
                  className="p-3 rounded-xl text-xs"
                  style={{ background: "#EEF2FF", color: "#4F46E5" }}
                >
                  💡 Email sẽ được gửi đến <strong>Subscriber</strong> đã đăng ký nhận tin. Sản phẩm hiển thị là các sản phẩm đang sale (hoặc sản phẩm bạn chọn ở bên trái).
                </div>
                <button
                  onClick={sendPromo}
                  disabled={sending}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : "✉️ Gửi email đến Subscriber"}
                </button>
              </div>
            </CARD>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
