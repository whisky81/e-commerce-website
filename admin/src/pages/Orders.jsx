import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { fetchOrders, updateOrderStatus, bulkUpdateStatus } from '../api/orders'
import { previewShipping, createShipping, cancelShipping } from '../api/v3/shipping'
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle, CreditCard, Banknote, Calendar, RefreshCw, Send, AlertTriangle } from 'lucide-react'

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(n)

const statusConfig = {
  pending: { label: 'Chờ xác nhận', color: 'bg-orange-100 text-orange-700', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700', icon: Package },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const STATUS_FLOW = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { type, ...data }

  // Filters
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

  const fetchAllOrders = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: pagination.limit }
      if (filters.status) params.status = filters.status
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod
      if (filters.search) params.search = filters.search

      const response = await fetchOrders(params)
      if (response.data.success) {
        setOrders(response.data.data || [])
        if (response.data.meta) {
          setPagination(p => ({
            ...p,
            page: response.data.meta.page || page,
            total: response.data.meta.total || 0,
            totalPages: response.data.meta.totalPages || 1,
          }))
        }
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (e, orderId) => {
    try {
      setProcessingOrderId(orderId)
      const response = await updateOrderStatus(orderId, e.target.value)
      if (response.data.success) {
        toast.success(response.data.message || 'Cập nhật trạng thái thành công')
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: e.target.value } : o))
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật trạng thái')
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleBulkStatus = async (status) => {
    const ids = orders.filter(o => o.status === 'pending').map(o => o._id)
    if (ids.length === 0) { toast.warning('Không có đơn hàng nào ở trạng thái chờ xác nhận'); return }
    setConfirmAction({ type: 'bulkStatus', ids, status })
    return
  }

  const confirmBulkStatus = async () => {
    const action = confirmAction
    setConfirmAction(null)
    if (!action) return
    const { ids, status } = action
    try {
      const response = await bulkUpdateStatus(ids, status)
      if (response.data.success) {
        toast.success(`Đã cập nhật ${ids.length} đơn hàng`)
        fetchAllOrders(pagination.page)
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật hàng loạt')
    }
  };

  const handleCreateShipping = async (orderId) => {
    setShippingLoading(orderId)
    try {
      const res = await createShipping(orderId)
      if (res.data.success) {
        toast.success('Đã tạo đơn vận chuyển!')
        fetchAllOrders(pagination.page)
      } else {
        throw new Error(res.data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể tạo đơn vận chuyển')
    } finally {
      setShippingLoading(null)
    }
  }

  const handleCancelShipping = async (orderId, shippingOrderId) => {
    setConfirmAction({ type: 'cancelShipping', orderId, shippingOrderId })
    return
  }

  const confirmCancelShipping = async () => {
    const action = confirmAction
    setConfirmAction(null)
    if (!action) return
    const { orderId, shippingOrderId } = action
    setShippingLoading(orderId)
    try {
      const res = await cancelShipping(shippingOrderId)
      if (res.data.success) {
        toast.success('Đã hủy đơn vận chuyển')
        fetchAllOrders(pagination.page)
      } else {
        throw new Error(res.data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể hủy đơn vận chuyển')
    } finally {
      setShippingLoading(null)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [filters]) // eslint-disable-line

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi, cập nhật trạng thái và xử lý đơn hàng</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Tìm theo mã đơn, tên khách..."
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm w-64 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_FLOW.map(s => (
            <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
          ))}
        </select>
        <select
          value={filters.paymentMethod}
          onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
        >
          <option value="">Tất cả thanh toán</option>
          <option value="cod">COD</option>
          <option value="bank">Stripe</option>
          <option value="momo">MoMo</option>
          <option value="vnpay">VNPay</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => handleBulkStatus('confirmed')}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2 size={16} /> Xác nhận tất cả
          </button>
          <button
            onClick={() => fetchAllOrders(pagination.page)}
            className="px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-300 border-t-indigo-600" />
            Đang tải danh sách đơn hàng...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-900 font-semibold">Chưa có đơn hàng nào</p>
            <p className="text-sm text-slate-500 mt-1">Đơn hàng mới sẽ xuất hiện tại đây</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Mã ĐH</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Ngày đặt</th>
                    <th className="px-6 py-4 text-right">Tổng tiền</th>
                    <th className="px-6 py-4 text-center">Thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thao tác</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => {
                    const StatusIcon = statusConfig[order.status]?.icon || Clock
                    const isExpanded = expandedId === order._id

                    return (
                      <React.Fragment key={order._id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {order._id?.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">{order.shippingAddress?.fullName || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{order.shippingAddress?.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            {fmt(order.totalAmount || order.total)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentMethod === 'bank' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {order.paymentMethod === 'bank' ? <CreditCard size={12} /> : <Banknote size={12} />}
                              {order.paymentMethod?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {processingOrderId === order._id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-300 border-t-indigo-600" />
                            ) : (
                              <select
                                value={order.status}
                                onChange={e => statusHandler(e, order._id)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${statusConfig[order.status]?.color}`}
                              >
                                {STATUS_FLOW.map(s => (
                                  <option key={s} value={s}>{statusConfig[s]?.label}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 items-center">
                              {/* Shipping action */}
                              {order.status === 'confirmed' && !order.shippingOrderId && (
                                <button
                                  onClick={() => handleCreateShipping(order._id)}
                                  disabled={shippingLoading === order._id}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  {shippingLoading === order._id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white" />
                                  ) : (
                                    <Send size={12} />
                                  )}
                                  Tạo VC
                                </button>
                              )}
                              {order.shippingOrderId && order.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelShipping(order._id, order.shippingOrderId)}
                                  disabled={shippingLoading === order._id}
                                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  {shippingLoading === order._id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-red-300 border-t-red-600" />
                                  ) : (
                                    <AlertTriangle size={12} />
                                  )}
                                  Hủy VC
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleExpand(order._id)}
                              className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-slate-50/50">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Items */}
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Package size={16} /> Sản phẩm ({order.orderItems?.length || 0})
                                  </h4>
                                  <div className="space-y-2">
                                    {order.orderItems?.map((item, idx) => (
                                      <div key={idx} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md border border-slate-100" />
                                        <div className="flex-1">
                                          <p className="font-medium text-slate-900 line-clamp-1">
                                            <Link to={`/products/${item.product}`} className="hover:text-blue-600 transition-colors">
                                              {item.name}
                                            </Link>
                                          </p>
                                          <div className="flex justify-between items-center mt-2">
                                            <p className="text-slate-500 text-sm">SL: {item.quantity}</p>
                                            <p className="font-semibold text-slate-800">{fmt(item.price)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Customer & Shipping Details */}
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Truck size={16} /> Thông tin giao hàng
                                  </h4>
                                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Người nhận:</span>
                                      <span className="font-medium text-slate-900">{order.shippingAddress?.fullName}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Điện thoại:</span>
                                      <span className="font-medium text-slate-900">{order.shippingAddress?.phone}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Địa chỉ:</span>
                                      <span className="text-slate-700">
                                        {order.shippingAddress?.street}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                                      </span>
                                    </div>
                                    {order.shippingOrderId && (
                                      <div className="grid grid-cols-[100px_1fr] gap-2">
                                        <span className="text-slate-500">Mã VC:</span>
                                        <span className="font-mono text-indigo-600">{order.shippingOrderId}</span>
                                      </div>
                                    )}
                                    <div className="border-t border-slate-100 my-2 pt-2"></div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">Phương thức:</span>
                                      <span className="uppercase font-medium text-slate-700">{order.paymentMethod}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-slate-500">ID đơn hàng:</span>
                                      <span className="font-mono text-xs text-slate-500">{order._id}</span>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                <span className="text-sm text-slate-500">
                  Hiển thị {orders.length} / {pagination.total} đơn hàng
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchAllOrders(pagination.page - 1)}
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-slate-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchAllOrders(pagination.page + 1)}
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Xác nhận hành động</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {confirmAction.type === 'bulkStatus'
                    ? `Xác nhận ${confirmAction.ids.length} đơn hàng thành "${statusConfig[confirmAction.status]?.label || confirmAction.status}"?`
                    : 'Bạn chắc chắn muốn hủy đơn vận chuyển này?'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmAction.type === 'bulkStatus' ? confirmBulkStatus : confirmCancelShipping}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

export default Orders
