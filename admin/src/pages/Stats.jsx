import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchStats } from "../api/stats";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Package, DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, CreditCard, Clock, CheckCircle2 } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const fmtShort = (n) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const StatCard = ({ label, value, sub, bgClass, icon: Icon }) => (
  <div className={`rounded-2xl p-5 text-white relative overflow-hidden ${bgClass}`}>
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 bg-white" />
    <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full opacity-10 bg-white" />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-2 flex items-center gap-1"><TrendingUp size={12}/> {sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

// ─── Custom Tooltip cho BarChart ─────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-800 mb-1 truncate max-w-[200px]">{label}</p>
        <p className="text-blue-600 font-bold">{payload[0].value} đã bán</p>
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ["#F97316", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"];
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
        const res = await fetchStats();
        if (res.data.success) setData(res.data.data.stats);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-slate-500">Không có dữ liệu thống kê.</div>;

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Thống kê cửa hàng</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hoạt động kinh doanh, doanh thu và tồn kho</p>
      </div>

      {/* ─── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Đơn hàng"
          value={data.orderCount.toLocaleString("vi-VN")}
          bgClass="bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30 shadow-lg" icon={Package} />
        <StatCard
          label="Tổng doanh thu"
          value={fmtShort(data.revenue)}
          sub={`Thực thu: ${fmtShort(data.paidRevenue)}`}
          bgClass="bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/30 shadow-lg" icon={DollarSign} />
        <StatCard label="Sản phẩm"
          value={data.productCount.toLocaleString("vi-VN")}
          bgClass="bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30 shadow-lg" icon={ShoppingBag} />
        <StatCard label="Khách hàng"
          value={data.userCount.toLocaleString("vi-VN")}
          bgClass="bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/30 shadow-lg" icon={Users} />
      </div>

      {/* ─── Revenue breakdown ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="text-emerald-500" /> Chi tiết doanh thu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Tổng doanh thu (đơn không hủy)",  value: fmt(data.revenue), icon: DollarSign, colorClass: "text-blue-600", bgClass: "bg-blue-50" },
            { label: "Đã thực thu (Đã thanh toán)", value: fmt(data.paidRevenue), icon: CreditCard, colorClass: "text-emerald-600", bgClass: "bg-emerald-50" },
            { label: "Chờ thu (COD chưa giao)", value: fmt(Math.max(0, data.revenue - data.paidRevenue)), icon: Clock, colorClass: "text-orange-600", bgClass: "bg-orange-50" },
          ].map((c, idx) => (
            <div key={idx} className={`p-5 rounded-xl ${c.bgClass} flex flex-col justify-center`}>
              <div className="flex items-center gap-2 mb-2">
                <c.icon size={16} className={c.colorClass} />
                <p className="text-sm font-medium text-slate-600">{c.label}</p>
              </div>
              <p className={`text-2xl font-bold ${c.colorClass}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Pie – Trạng thái đơn hàng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="text-blue-500" /> Trạng thái đơn hàng
          </h2>
          <div className="flex-1 flex flex-col justify-center">
            {pieData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} đơn`, n]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend formatter={(value) => <span className="text-sm font-medium text-slate-700">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-12">
                Chưa có dữ liệu đơn hàng
              </div>
            )}
          </div>
        </div>

        {/* Bar – Sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="text-orange-500" /> Sản phẩm bán chạy
            </h2>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tổng đã bán</p>
              <p className="text-xl font-bold text-blue-600">{(data.totalSoldUnits ?? 0).toLocaleString("vi-VN")}</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            {barData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="sold" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={48} name="Đã bán" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-12">
                Chưa có dữ liệu bán hàng
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tồn kho thấp ─────────────────────────────────────────────────── */}
      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
        <h2 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-orange-600" /> Cảnh báo tồn kho thấp
        </h2>
        <p className="text-sm text-orange-600/80 mb-4 font-medium">
          Các sản phẩm có số lượng ≤ {data.lowStockThreshold}
        </p>
        
        <div className="space-y-3">
          {(data.lowStockProducts || []).length === 0 ? (
            <div className="bg-white p-4 rounded-xl border border-orange-100 flex items-center gap-3 text-orange-700">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-orange-600" />
              </div>
              <span className="font-medium">Tuyệt vời! Không có sản phẩm nào dưới ngưỡng tồn kho an toàn.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data.lowStockProducts || []).map(p => (
                <div key={p._id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-800 line-clamp-2" title={p.name}>
                    {p.name}
                  </span>
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-500">Số lượng hiện tại</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      p.stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {p.stock === 0 ? "Hết hàng" : `${p.stock} sản phẩm`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;