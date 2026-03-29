import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

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
        Đang tải thống kê…
      </div>
    )
  }

  if (!data) {
    return <p className="text-red-500">Không có dữ liệu</p>
  }

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thống kê cửa hàng</h1>
        <p className="text-gray-500 mt-1">Tổng quan đơn hàng, doanh thu và tồn kho</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 shadow-lg">
          <p className="text-sm text-slate-300">Đơn hàng (không hủy)</p>
          <p className="text-3xl font-semibold mt-2">{data.orderCount}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-lg">
          <p className="text-sm text-emerald-100">Doanh thu</p>
          <p className="text-2xl font-semibold mt-2">{fmt(data.revenue)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-6 shadow-lg">
          <p className="text-sm text-violet-100">Sản phẩm</p>
          <p className="text-3xl font-semibold mt-2">{data.productCount}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 shadow-lg">
          <p className="text-sm text-amber-100">Khách hàng</p>
          <p className="text-3xl font-semibold mt-2">{data.userCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Đơn vị đã bán (tổng)</h2>
        <p className="text-4xl font-bold text-gray-900">
          {(data.totalSoldUnits ?? 0).toLocaleString('vi-VN')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bán chạy</h2>
          <ul className="space-y-3">
            {(data.topProducts || []).map((p) => (
              <li key={p._id} className="flex justify-between gap-4 text-sm border-b border-gray-100 pb-3 last:border-0">
                <span className="text-gray-700 line-clamp-1">{p.name}</span>
                <span className="text-gray-500 shrink-0">Đã bán {p.soldCount ?? 0}</span>
              </li>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <li className="text-gray-400">Chưa có dữ liệu</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">
            Cảnh báo tồn kho thấp (≤ {data.lowStockThreshold})
          </h2>
          <ul className="space-y-2 text-sm">
            {(data.lowStockProducts || []).map((p) => (
              <li key={p._id} className="flex justify-between text-amber-950">
                <span className="line-clamp-1">{p.name}</span>
                <span className="shrink-0 font-medium">Còn {p.stock}</span>
              </li>
            ))}
            {(!data.lowStockProducts || data.lowStockProducts.length === 0) && (
              <li className="text-amber-800/80">Không có sản phẩm nào dưới ngưỡng</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Stats
