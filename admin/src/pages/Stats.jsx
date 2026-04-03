// admin/src/pages/Stats.jsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const StatCard = ({ label, value, sub, gradient, icon }) => (
  <div
    className="rounded-2xl p-5 text-white relative overflow-hidden"
    style={{ background: gradient }}
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 bg-white" />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

// ─── Custom Tooltip cho BarChart ─────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-indigo-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1 truncate max-w-48">{label}</p>
        <p className="text-indigo-600 font-bold">{payload[0].value} đã bán</p>
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"];
const STATUS_LABELS = {
  pending:   "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping:  "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const Stats = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/v2/admin/stats`, { withCredentials: true });
        if (res.data.success) setData(res.data.data);
        else throw new Error(res.data.message);
      } catch (e) {
        toast.error(e.message || "Không tải được thống kê");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: "#EDE9FE" }} />
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-rose-500 text-sm">Không có dữ liệu</p>;

  const { statusCounts = {} } = data;

  // ─── Dữ liệu biểu đồ Pie ─────────────────────────────────────────────────
  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value }));

  // ─── Dữ liệu biểu đồ Bar (top products) ─────────────────────────────────
  const barData = (data.topProducts || []).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
    sold: p.soldCount ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1E1B4B" }}>
          Thống kê cửa hàng
        </h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Tổng quan đơn hàng, doanh thu và tồn kho
        </p>
      </div>

      {/* ─── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Đơn hàng (không hủy)"
          value={data.orderCount.toLocaleString("vi-VN")}
          gradient="linear-gradient(135deg,#1E1B4B,#3730A3)" icon="📦" />
        <StatCard
          label="Doanh thu (tất cả đơn)"
          value={fmt(data.revenue)}
          sub={`Đã thu: ${fmt(data.paidRevenue)}`}
          gradient="linear-gradient(135deg,#065F46,#047857)" icon="💰" />
        <StatCard label="Sản phẩm"
          value={data.productCount.toLocaleString("vi-VN")}
          gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" icon="🛍️" />
        <StatCard label="Khách hàng"
          value={data.userCount.toLocaleString("vi-VN")}
          gradient="linear-gradient(135deg,#92400E,#B45309)" icon="👥" />
      </div>

      {/* ─── Revenue breakdown ────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1.5px solid #DDD6FE" }}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1E1B4B" }}>💰 Chi tiết doanh thu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng doanh thu (đơn không hủy)",  value: fmt(data.revenue),     color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Đã thực thu (isPaid = true)",      value: fmt(data.paidRevenue), color: "#059669", bg: "#ECFDF5" },
            { label: "Chờ thu (COD chưa giao)",
              value: fmt(Math.max(0, data.revenue - data.paidRevenue)),
              color: "#D97706", bg: "#FFFBEB" },
          ].map(c => (
            <div key={c.label} className="p-4 rounded-xl" style={{ background: c.bg }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#6B7280" }}>{c.label}</p>
              <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Pie – Trạng thái đơn hàng */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1.5px solid #DDD6FE" }}>
          <h2 className="text-base font-bold mb-4" style={{ color: "#1E1B4B" }}>
            📊 Trạng thái đơn hàng
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} đơn`, n]} />
                <Legend
                  formatter={value => (
                    <span style={{ fontSize: 11, color: "#374151" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">Chưa có dữ liệu đơn hàng</p>
          )}

          {/* Count grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              { key: "pending",   label: "Chờ xác nhận", color: "#F59E0B", bg: "#FFFBEB" },
              { key: "confirmed", label: "Đã xác nhận",  color: "#3B82F6", bg: "#EFF6FF" },
              { key: "shipping",  label: "Đang giao",    color: "#8B5CF6", bg: "#F5F3FF" },
              { key: "delivered", label: "Đã giao",      color: "#10B981", bg: "#ECFDF5" },
              { key: "cancelled", label: "Đã hủy",       color: "#EF4444", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.key} className="p-2.5 rounded-xl text-center" style={{ background: s.bg }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>
                  {statusCounts[s.key] ?? 0}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bar – Sản phẩm bán chạy */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1.5px solid #DDD6FE" }}>
          <h2 className="text-base font-bold mb-1" style={{ color: "#1E1B4B" }}>🏆 Sản phẩm bán chạy</h2>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
            Tổng đã bán:{" "}
            <strong style={{ color: "#4F46E5" }}>
              {(data.totalSoldUnits ?? 0).toLocaleString("vi-VN")}
            </strong>
          </p>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 0, right: 8, left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickFormatter={fmtShort}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="sold" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Đã bán" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* ─── Tồn kho thấp ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
      >
        <h2 className="text-base font-bold mb-1" style={{ color: "#92400E" }}>⚠️ Tồn kho thấp</h2>
        <p className="text-xs mb-4" style={{ color: "#B45309" }}>
          Ngưỡng ≤ {data.lowStockThreshold} sản phẩm
        </p>
        <div className="space-y-2">
          {(data.lowStockProducts || []).length === 0 ? (
            <p className="text-sm" style={{ color: "#92400E" }}>
              ✅ Không có sản phẩm nào dưới ngưỡng
            </p>
          ) : (
            (data.lowStockProducts || []).map(p => (
              <div key={p._id} className="flex justify-between items-center">
                <span className="text-sm line-clamp-1 flex-1 mr-3" style={{ color: "#78350F" }}>
                  {p.name}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.stock === 0 ? "Hết hàng" : `Còn ${p.stock}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;
