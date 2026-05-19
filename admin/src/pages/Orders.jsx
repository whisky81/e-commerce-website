import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Link, useSearchParams } from 'react-router-dom'
import {
  fetchOrders,
  updateOrderStatus,
  bulkCreateShippingOrders,
} from '../api/orders'
import {
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  Banknote,
  Calendar,
  Search,
} from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n ?? 0)

const lineItemImageUrl = (item) =>
  typeof item.image === 'string' ? item.image : item.image?.url ?? ''

const orderTotal = (order) =>
  order.totalFee ?? order.totalPrice ?? 0

const isOrderPaid = (order) => {
  if (order.payment?.status != null) {
    return order.payment.status === 'paid'
  }
  return Boolean(order.isPaid)
}

const paymentMethodLabel = (order) => {
  const m = order.payment?.method ?? order.paymentMethod
  if (m === 'cod') return 'COD'
  if (m === 'bank') return 'Stripe'
  return m ? String(m).toUpperCase() : '—'
}

const formatShippingAddress = (addr) => {
  if (!addr) return ''
  const w = addr.wardName ?? addr.ward
  const d = addr.districtName ?? addr.district
  const p = addr.provinceName ?? addr.province
  return [addr.street, w, d, p].filter(Boolean).join(', ')
}

const orderDisplayCode = (order) =>
  order.code ?? `#${order._id.slice(-6).toUpperCase()}`

const PAGE_SIZE = 12

const statusConfig = {
  pending: { label: 'Chờ xác nhận', color: 'bg-orange-100 text-orange-700', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700', icon: Package },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [searchParams, setSearchParams] = useSearchParams()
  const searchParam = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(searchParam)

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetchOrders({ page, limit: PAGE_SIZE, search: searchParam })
      if (response.data.success) {
        const fetchedOrders = response.data.data ?? []
        setOrders(fetchedOrders)
        setMeta(response.data.meta ?? null)

        // Automatically expand if search result yields exactly 1 order
        if (searchParam && fetchedOrders.length === 1) {
          setExpandedId(fetchedOrders[0]._id)
        } else if (!searchParam && expandedId && !fetchedOrders.find(o => o._id === expandedId)) {
          setExpandedId(null)
        }
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, searchParam])

  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  useEffect(() => {
    setSearchInput(searchParam)
  }, [searchParam])

  useEffect(() => {
    setSelectedIds([])
  }, [page])

  const pendingOnPage = orders.filter((o) => o.status === 'pending')
  const pendingIdsOnPage = pendingOnPage.map((o) => o._id)
  const allPendingSelected =
    pendingIdsOnPage.length > 0 &&
    pendingIdsOnPage.every((id) => selectedIds.includes(id))

  const toggleSelectOrder = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAllPending = (e) => {
    e.stopPropagation()
    if (allPendingSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pendingIdsOnPage.includes(id)))
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pendingIdsOnPage])])
    }
  }

  const handleBulkShipping = async (e) => {
    e.preventDefault()
    const ids = selectedIds.filter((id) => {
      const o = orders.find((x) => x._id === id)
      return o?.status === 'pending'
    })
    if (ids.length === 0) {
      toast.warning('Chọn ít nhất một đơn đang chờ xác nhận.')
      return
    }
    try {
      setBulkLoading(true)
      const response = await bulkCreateShippingOrders(ids)
      if (response.data.success) {
        const { success: ok = 0, failed = 0 } = response.data.data ?? {}
        toast.success(`GHN: thành công ${ok}, thất bại ${failed}`)
        setSelectedIds([])
        await fetchAllOrders()
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message
      toast.error(msg)
    } finally {
      setBulkLoading(false)
    }
  }

  const statusHandler = async (e, orderId) => {
    try {
      setProcessingOrderId(orderId)
      const response = await updateOrderStatus([orderId], e.target.value)
      if (response.data.success) {
        toast.success(response.data.message || 'Cập nhật trạng thái thành công')
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: e.target.value } : o,
          ),
        )
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message
      toast.error(msg)
    } finally {
      setProcessingOrderId(null)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const totalPages = meta?.totalPages ?? 1
  const hasPrev = meta?.hasPrev ?? page > 1
  const hasNext = meta?.hasNext ?? false

  if (loading && orders.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        Đang tải danh sách đơn hàng...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, cập nhật trạng thái và tạo đơn vận chuyển GHN cho đơn chờ xác nhận
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              if (searchInput.trim()) {
                setSearchParams({ search: searchInput.trim() })
              } else {
                setSearchParams({})
              }
            }}
            className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 mr-2"
          >
            <Search size={16} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã đơn hoặc ID..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="text-sm outline-none bg-transparent w-48"
            />
          </form>

          <button
            type="button"
            onClick={handleBulkShipping}
            disabled={bulkLoading || selectedIds.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkLoading ? 'Đang xử lý…' : 'Xác nhận & tạo GHN'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Chưa có đơn hàng nào"
            description="Đơn hàng mới sẽ xuất hiện tại đây."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3 py-4 w-10">
                      {pendingOnPage.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleSelectAllPending}
                          title="Chọn tất cả đơn chờ xác nhận trên trang này"
                          className="rounded border-slate-300"
                        />
                      )}
                    </th>
                    <th className="px-6 py-4">Mã ĐH</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Ngày đặt</th>
                    <th className="px-6 py-4 text-right">Tổng tiền</th>
                    <th className="px-6 py-4 text-center">Thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const isExpanded = expandedId === order._id
                    const paid = isOrderPaid(order)
                    const payLabel = paymentMethodLabel(order)
                    const showCodIcon = (order.payment?.method ?? order.paymentMethod) === 'cod'

                    return (
                      <React.Fragment key={order._id}>
                        <tr
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                          onClick={() => toggleExpand(order._id)}
                        >
                          <td
                            className="px-3 py-4"
                            onClick={
                              order.status === 'pending'
                                ? (e) => toggleSelectOrder(order._id, e)
                                : undefined
                            }
                          >
                            {order.status === 'pending' ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(order._id)}
                                onChange={(e) => toggleSelectOrder(order._id, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-slate-300"
                              />
                            ) : (
                              <span className="inline-block w-4" />
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-900">
                            {orderDisplayCode(order)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {order.shippingAddress?.fullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.shippingAddress?.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-800">
                            {fmt(orderTotal(order))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                                paid
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {showCodIcon ? <Banknote size={14} /> : <CreditCard size={14} />}
                              {paid ? 'Đã thanh toán' : 'Chưa TT'}
                            </span>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(e) => statusHandler(e, order._id)}
                                disabled={processingOrderId === order._id}
                                className={`text-xs font-medium px-2 py-1.5 rounded-md outline-none cursor-pointer transition-opacity ${statusConfig[order.status]?.color} ${processingOrderId === order._id ? 'opacity-50' : ''}`}
                              >
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <option key={key} value={key} className="bg-white text-slate-900">
                                    {config.label}
                                  </option>
                                ))}
                              </select>
                              {processingOrderId === order._id && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-center">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/50 border-b border-slate-200">
                            <td colSpan={8} className="px-6 py-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Package size={16} /> Chi tiết sản phẩm ({order.items?.length ?? 0})
                                  </h4>
                                  <div className="space-y-3">
                                    {(order.items ?? []).map((item, idx) => {
                                      const img = lineItemImageUrl(item)
                                      return (
                                        <div
                                          key={idx}
                                          className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200"
                                        >
                                          {img ? (
                                            <img
                                              src={img}
                                              alt={item.name}
                                              className="w-16 h-16 object-cover rounded-md border border-slate-100"
                                            />
                                          ) : (
                                            <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-200" />
                                          )}
                                          <div className="flex-1">
                                            <p className="font-medium text-slate-900 line-clamp-1">
                                              <Link
                                                to={`/products/${item.product}`}
                                                className="hover:text-blue-600 transition-colors"
                                              >
                                                {item.name}
                                              </Link>
                                            </p>
                                            <div className="flex justify-between items-center mt-2">
                                              <p className="text-slate-500 text-sm">SL: {item.quantity}</p>
                                              <p className="font-semibold text-slate-800">{fmt(item.price)}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Truck size={16} /> Thông tin giao hàng
                                  </h4>
                                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Người nhận:</span>
                                      <span className="font-medium text-slate-900">
                                        {order.shippingAddress?.fullName}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Điện thoại:</span>
                                      <span className="font-medium text-slate-900">
                                        {order.shippingAddress?.phone}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Địa chỉ:</span>
                                      <span className="text-slate-700">
                                        {formatShippingAddress(order.shippingAddress)}
                                      </span>
                                    </div>
                                    {order.shipping && (
                                      <>
                                        <div className="border-t border-slate-100 my-2 pt-2 font-medium text-slate-800">
                                          Vận chuyển GHN
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                          <span className="text-slate-500">Mã vận đơn:</span>
                                          <span className="font-mono text-slate-800">
                                            {order.shipping.code ? (
                                              <a href="https://5sao.ghn.dev" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline" title="Tra cứu trên GHN">
                                                {order.shipping.code}
                                              </a>
                                            ) : '—'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                          <span className="text-slate-500">Trạng thái VC:</span>
                                          <span>{order.shipping.status ?? '—'}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                          <span className="text-slate-500">Phí GHN:</span>
                                          <span>{fmt(order.shipping.fee)}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                          <span className="text-slate-500">Dự kiến giao:</span>
                                          <span>
                                            {order.shipping.expectedDelivery
                                              ? new Date(order.shipping.expectedDelivery).toLocaleString('vi-VN')
                                              : '—'}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    <div className="border-t border-slate-100 my-2 pt-2"></div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Phương thức:</span>
                                      <span className="font-medium text-slate-700">{payLabel}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">ID đơn hàng:</span>
                                      <span className="font-mono text-slate-500 break-all">{order._id}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {meta && (meta.totalPages > 1 || meta.total > PAGE_SIZE) && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 text-sm text-slate-600">
                <span>
                  Hiển thị trang {meta.page} / {totalPages} ({meta.total ?? orders.length} đơn)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Orders
