import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

// Simple Chart Component (no external dependency)
const SimpleBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className='mt-4'>
      <h3 className='font-semibold text-gray-800 mb-3'>{title}</h3>
      <div className='space-y-2'>
        {data.map((item, idx) => (
          <div key={idx} className='flex items-center gap-3'>
            <span className='text-xs text-gray-600 w-20 truncate'>{item.label}</span>
            <div className='flex-1 bg-gray-200 rounded-full h-6 overflow-hidden'>
              <div 
                className='bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-2 transition-all'
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <span className='text-xs font-bold text-white'>{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stats = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/v2/admin/stats`,
          { withCredentials: true }
        )
        if (res.data.success) {
          setData(res.data.data)
        } else {
          throw new Error(res.data.message)
        }
      } catch (e) {
        toast.error(e.message || 'Không tải được thống kê')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-500 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Đang tải thống kê…
        </div>
      </div>
    )
  }

  if (!data) {
    return <p className="text-red-500">Không có dữ liệu</p>
  }

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

  const topProductsData = (data.topProducts || []).map(p => ({
    label: p.name.substring(0, 15),
    value: p.soldCount ?? 0
  }));

  const lowStockData = (data.lowStockProducts || []).map(p => ({
    label: p.name.substring(0, 15),
    value: p.stock
  }));

  const orderStatusData = [
    { label: 'Tất cả đơn', value: data.orderCount },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-lg'>
        <h1 className="text-3xl font-bold mb-2">📊 Thống kê cửa hàng</h1>
        <p className="text-slate-300">Tổng quan đơn hàng, doanh thu và tồn kho</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className='flex items-center justify-between mb-2'>
            <p className="text-sm text-slate-300">Đơn hàng (không hủy)</p>
            <span className='text-2xl'>📦</span>
          </div>
          <p className="text-4xl font-bold">{data.orderCount}</p>
          <p className="text-xs text-slate-400 mt-2">Tổng số đơn hàng</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className='flex items-center justify-between mb-2'>
            <p className="text-sm text-emerald-100">Doanh thu</p>
            <span className='text-2xl'>💰</span>
          </div>
          <p className="text-3xl font-bold">{fmt(data.revenue).split(',')[0]}</p>
          <p className="text-xs text-emerald-100 mt-2">{fmt(data.revenue)}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className='flex items-center justify-between mb-2'>
            <p className="text-sm text-violet-100">Sản phẩm</p>
            <span className='text-2xl'>🛍️</span>
          </div>
          <p className="text-4xl font-bold">{data.productCount}</p>
          <p className="text-xs text-violet-200 mt-2">Sản phẩm trong kho</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className='flex items-center justify-between mb-2'>
            <p className="text-sm text-amber-100">Khách hàng</p>
            <span className='text-2xl'>👥</span>
          </div>
          <p className="text-4xl font-bold">{data.userCount}</p>
          <p className="text-xs text-amber-100 mt-2">Người dùng tổng</p>
        </div>
      </div>

      {/* Total Units & Details */}
      <div className='rounded-2xl border border-gray-200 bg-white p-8 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className="text-2xl font-bold text-gray-900">📈 Chỉ số bán hàng</h2>
          <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold'>
            {(data.totalSoldUnits ?? 0).toLocaleString('vi-VN')} đơn vị
          </span>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
          <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg'>
            <p className='text-sm text-gray-600'>Tổng đơn vị đã bán</p>
            <p className='text-3xl font-bold text-blue-600'>{(data.totalSoldUnits ?? 0).toLocaleString('vi-VN')}</p>
          </div>
          <div className='bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg'>
            <p className='text-sm text-gray-600'>Doanh thu trung bình</p>
            <p className='text-2xl font-bold text-green-600'>
              {data.orderCount > 0 ? fmt(data.revenue / data.orderCount) : '0 ₫'}
            </p>
          </div>
          <div className='bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg'>
            <p className='text-sm text-gray-600'>Tỷ lệ chuyển đổi</p>
            <p className='text-3xl font-bold text-purple-600'>
              {data.userCount > 0 ? ((data.orderCount / data.userCount) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className='grid md:grid-cols-2 gap-8'>
        {/* Top Products Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🔥 Sản phẩm bán chạy
          </h2>
          {topProductsData.length > 0 ? (
            <SimpleBarChart data={topProductsData} title="Top 8 sản phẩm" />
          ) : (
            <p className="text-gray-400 text-center py-6">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Low Stock Chart */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
            ⚠️ Cảnh báo tồn kho thấp (≤ {data.lowStockThreshold})
          </h2>
          {lowStockData.length > 0 ? (
            <SimpleBarChart data={lowStockData} title="Sản phẩm sắp hết" />
          ) : (
            <p className="text-amber-800/80 text-center py-6">✅ Tất cả sản phẩm đều có hàng</p>
          )}
        </div>
      </div>

      {/* Detailed Lists */}
      <div className='grid md:grid-cols-2 gap-8'>
        {/* Top Products List */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Top sản phẩm chi tiết</h2>
          <ul className="space-y-3">
            {(data.topProducts || []).map((p, idx) => (
              <li key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-bold bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'>
                    {idx + 1}
                  </span>
                  <span className='text-gray-800 font-medium line-clamp-2'>{p.name}</span>
                </div>
                <span className='text-gray-600 font-semibold shrink-0'>Đã bán {p.soldCount ?? 0}</span>
              </li>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <li className="text-gray-400 text-center py-4">Chưa có dữ liệu</li>
            )}
          </ul>
        </div>

        {/* Low Stock Products List */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">📦 Sản phẩm sắp hết chi tiết</h2>
          <ul className="space-y-2 text-sm">
            {(data.lowStockProducts || []).map((p, idx) => (
              <li key={p._id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-100/50 transition-colors">
                <span className='text-amber-950 font-medium line-clamp-2'>{p.name}</span>
                <span className='text-amber-700 font-bold shrink-0 bg-amber-200 px-2 py-1 rounded'>
                  Còn {p.stock}
                </span>
              </li>
            ))}
            {(!data.lowStockProducts || data.lowStockProducts.length === 0) && (
              <li className="text-amber-800/80 text-center py-4">✅ Không có sản phẩm dưới ngưỡng</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Stats
