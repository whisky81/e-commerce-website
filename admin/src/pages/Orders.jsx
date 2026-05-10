import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { fetchOrders, updateOrderStatus } from '../api/orders'
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle, CreditCard, Banknote, Calendar } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

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

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const response = await fetchOrders()
      if (response.data.success) {
        setOrders(response.data.data)
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (e, orderId) => {
    try {
      setProcessingOrderId(orderId)
      const response = await updateOrderStatus([orderId], e.target.value)
      if (response.data.success) {
        toast.success(response.data.message || 'Cập nhật trạng thái thành công')
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: e.target.value } : o))
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcessingOrderId(null)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        Đang tải danh sách đơn hàng...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi, cập nhật trạng thái và xử lý đơn hàng</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState icon="📋" title="Chưa có đơn hàng nào" description="Đơn hàng mới sẽ xuất hiện tại đây." />
        ) : (
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
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock
                  const isExpanded = expandedId === order._id

                  return (
                    <React.Fragment key={order._id}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                        onClick={() => toggleExpand(order._id)}
                      >
                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{order.shippingAddress.fullName}</div>
                          <div className="text-xs text-slate-500">{order.shippingAddress.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-800">
                          {fmt(order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                            order.isPaid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.paymentMethod === 'cod' ? <Banknote size={14} /> : <CreditCard size={14} />}
                            {order.isPaid ? 'Đã thanh toán' : 'Chưa TT'}
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
                                <option key={key} value={key} className="bg-white text-slate-900">{config.label}</option>
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

                      {/* Drill-down Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                          <td colSpan={7} className="px-6 py-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              {/* Order Items */}
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                  <Package size={16} /> Chi tiết sản phẩm ({order.items.length})
                               </h4>
                                <div className="space-y-3">
                                  {order.items.map((item, idx) => (
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
                                    <span className="font-medium text-slate-900">{order.shippingAddress.fullName}</span>
                                  </div>
                                  <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-slate-500">Điện thoại:</span>
                                    <span className="font-medium text-slate-900">{order.shippingAddress.phone}</span>
                                  </div>
                                  <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-slate-500">Địa chỉ:</span>
                                    <span className="text-slate-700">
                                      {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
                                    </span>
                                  </div>
                                  <div className="border-t border-slate-100 my-2 pt-2"></div>
                                  <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-slate-500">Phương thức:</span>
                                    <span className="uppercase font-medium text-slate-700">{order.paymentMethod}</span>
                                  </div>
                                  <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-slate-500">ID đơn hàng:</span>
                                    <span className="font-mono text-slate-500">{order._id}</span>
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
        )}
      </div>
    </div>
  )
}

export default Orders