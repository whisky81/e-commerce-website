  import React, { useState, useEffect } from 'react';
  import useShopContext from "../hooks/useShopContext";
  import Title from "../components/Title";
  import { toast } from 'react-toastify';
  import axios from 'axios';
  import Address from '../components/Address'; 
  import ProductRow from '../components/ProductRow';
  import { formatPrice, formatDate } from '../utils/formats';
  const Orders = () => {
    const { backendUrl, isAuthenticated, navigate } = useShopContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const fetchOrdersData = async () => {
      try {
        setLoading(true);
        if (!isAuthenticated) {
          navigate("/login");
          return;
        }
        
        const response = await axios.get(
          backendUrl + "/api/v2/orders/my",
          {
            withCredentials: true
          }
        );
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        setOrders(response.data.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchOrdersData();
    }, [isAuthenticated]);

    const getStatusInfo = (status) => {
      const statusMap = {
        'pending': { color: 'bg-yellow-500', text: 'Chờ xác nhận' },
        'confirmed': { color: 'bg-blue-500', text: 'Đã xác nhận' },
        'shipping': { color: 'bg-purple-500', text: 'Đang giao hàng' },
        'delivered': { color: 'bg-green-500', text: 'Đã giao hàng' },
        'cancelled': { color: 'bg-red-500', text: 'Đã hủy' }
      };
      return statusMap[status] || { color: 'bg-gray-500', text: status };
    };

    const getPaymentMethodText = (method) => {
      const methodMap = {
        'cod': 'Thanh toán khi nhận hàng',
        'bank': 'Chuyển khoản ngân hàng',
        'momo': 'Ví MoMo',
        'vnpay': 'VNPay',
        "stripe": "Stripe"
      };
      return methodMap[method] || method;
    };

    const toggleOrderExpand = (orderId) => {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) {
      return (
        <div className='border-t pt-16'>
          <div className='text-2xl'>
            <Title text1={'Đơn'} text2={'hàng'} />
          </div>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
          </div>
        </div>
      );
    }

    return (
      <div className='border-t pt-16'>
        <div className='text-2xl mb-8'>
          <Title text1={'Đơn'} text2={'hàng của tôi'} />
        </div>

        {orders.length === 0 ? (
          <div className='text-center py-16 bg-gray-50 rounded-lg'>
            <p className='text-gray-500 text-lg'>Bạn chưa có đơn hàng nào</p>
            <button 
              onClick={() => navigate("/collection")} 
              className='mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition'
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className='space-y-6'>
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order._id} className='border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition'>
                  {/* Order Header */}
                  <div 
                    className='bg-gray-50 p-4 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4'
                    onClick={() => toggleOrderExpand(order._id)}
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-500'>Mã đơn:</span>
                        <span className='font-mono text-sm'>{order._id}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.color}`}></span>
                        <span className='text-sm font-medium'>{statusInfo.text}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-4 text-sm'>
                      <span className='text-gray-600'>{formatDate(order.createdAt)}</span>
                      <span className='font-semibold text-blue-600'>{formatPrice(order.totalPrice)}</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Order Details - Expandable */}
                  {expandedOrder === order._id && (
                    <div className='p-4 border-t'>
                      {/* Order Items */}
                      <div className='space-y-4'>
                        <h3 className='font-semibold text-lg mb-3'>Sản phẩm đã đặt</h3>
                        {order.items.map((item, index) => (
                          <ProductRow image={item.image} name={item.name} productId={item.product} price={item.price} quantity={item.quantity}/>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Shipping Address */}
                        <div>
                          <h3 className='font-semibold text-lg mb-3'>Địa chỉ giao hàng</h3>
                          <Address 
                            address={order.shippingAddress}
                            isSelected={false}
                            readOnly={true}
                          />
                        </div>

                        {/* Payment Info */}
                        <div>
                          <h3 className='font-semibold text-lg mb-3'>Thông tin thanh toán</h3>
                          <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600'>Phương thức:</span>
                              <span className='font-medium'>{getPaymentMethodText(order.paymentMethod)}</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600'>Trạng thái:</span>
                              <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                            </div>
                            <div className='border-t my-2'></div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600'>Tạm tính:</span>
                              <span>{formatPrice(order.itemsPrice)}</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600'>Phí vận chuyển:</span>
                              <span>{formatPrice(order.shippingPrice)}</span>
                            </div>
                            <div className='flex justify-between font-semibold'>
                              <span>Tổng cộng:</span>
                              <span className='text-blue-600'>{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='mt-6 flex flex-wrap gap-3'>
                        <button 
                          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm'
                          onClick={() => {/* Track order logic */}}
                        >
                          Theo dõi đơn hàng
                        </button>
                        {order.status === 'delivered' && !order.isPaid && order.paymentMethod === 'cod' && (
                          <button 
                            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm'
                            onClick={() => {/* Confirm payment logic */}}
                          >
                            Xác nhận đã thanh toán
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button 
                            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm'
                            onClick={() => {/* Cancel order logic */}}
                          >
                            Hủy đơn hàng
                          </button>
                        )}
                        <button 
                          className='px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm'
                          onClick={() => {/* Contact support logic */}}
                        >
                          Liên hệ hỗ trợ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  export default Orders;