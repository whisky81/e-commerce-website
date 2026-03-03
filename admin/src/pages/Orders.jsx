import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
const Orders = ({ isLogin }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingOrderId, setProcessingOrderId] = useState(null)

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        backendUrl + "/api/v2/orders",
        {
          withCredentials: true
        }
      )
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
      const response = await axios.put(
        backendUrl + "/api/v2/orders/status",
        {
          orderId,
          status: e.target.value
        },
        {
          withCredentials: true
        }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchAllOrders()
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
  }, [isLogin])

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Danh sách đơn hàng</h3>

      {loading && !orders.length ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Đang tải đơn hàng...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 border rounded-xl p-4 shadow-sm bg-white text-sm text-gray-700 relative"
            >
              {processingOrderId === order._id && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              )}

              <div>
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-center mb-2">
                    <img
                      src={item.image}
                      alt=""
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <div>
                      <p className="font-medium"><Link to={`/products/${item.product}`}>{item.name}</Link></p>
                      <p className="text-gray-500">
                        {item.quantity} × {item.price.toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p className="text-gray-500">
                  {order.shippingAddress.street}, {order.shippingAddress.ward},{" "}
                  {order.shippingAddress.district}, {order.shippingAddress.province}
                </p>
              </div>

              <div>
                <p>Method: <span className="font-medium">{order.paymentMethod}</span></p>
                <p>
                  Payment:{" "}
                  <span
                    className={`font-semibold ${order.isPaid ? "text-green-600" : "text-red-500"
                      }`}
                  >
                    {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </p>
                <p>Status: <span className="capitalize">{order.status}</span></p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-col justify-between">
                <p className="text-base font-semibold text-right">
                  {order.totalPrice.toLocaleString()}₫
                </p>

                <select
                  onChange={(e) => statusHandler(e, order._id)}
                  value={order.status}
                  disabled={processingOrderId === order._id}
                  className={`mt-2 p-2 border rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-black ${processingOrderId === order._id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipping">Shipping</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}

          {!loading && orders.length === 0 && (
            <p className="text-center text-gray-500 py-8">Không có đơn hàng nào</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Orders