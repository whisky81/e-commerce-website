// frontend/src/pages/PlayOrder.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import useShopContext from '../hooks/useShopContext'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import ProductRow from '../components/ProductRow'
import AddressForm from '../components/AddressForm'
import { addAddressV3 } from '../api/users'
import { previewOrder, placeOrderCod, placeOrderStripe } from '../api/orders'
import { formatAddressLine } from '../utils/formats'

const PlaceOrder = () => {
  const location = useLocation()
  const { navigate, cartItems, user } = useShopContext()
  const queryClient = useQueryClient()

  const selectedCartItems = useMemo(() => {
    const fromNav = location.state?.selectedCartItems
    if (Array.isArray(fromNav) && fromNav.length > 0) return fromNav
    return Object.values(cartItems)
  }, [location.state?.selectedCartItems, cartItems])

  const fromCartCheckout = Boolean(location.state?.fromCart)

  const orderItemsPayload = useMemo(
    () => selectedCartItems.map((item) => ({ product: item.id, quantity: item.quantity })),
    [selectedCartItems],
  )

  const [method, setMethod] = useState('cod')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showAddressPopup, setShowAddressPopup] = useState(false)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  const [placing, setPlacing] = useState(false)

  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  /** @type {React.MutableRefObject<number>} */
  const previewTimer = useRef(0)

  useEffect(() => {
    if (!user?.addresses?.length) {
      setSelectedAddress(null)
      return
    }
    setSelectedAddress((current) => {
      if (!current?._id) {
        return user.addresses.find((a) => a.isDefault) || user.addresses[0]
      }
      const updated = user.addresses.find((a) => a._id === current._id)
      return updated ?? (user.addresses.find((a) => a.isDefault) ?? user.addresses[0])
    })
  }, [user])

  useEffect(() => {
    clearTimeout(previewTimer.current)

    if (!selectedAddress?._id || orderItemsPayload.length === 0) {
      setPreviewLoading(false)
      setPreview(null)
      return
    }

    setPreview(null)
    setPreviewLoading(true)

    const addressId = selectedAddress._id
    const orderItems = orderItemsPayload

    previewTimer.current = window.setTimeout(async () => {
      try {
        const res = await previewOrder({ addressId, orderItems })
        if (res.data.success) setPreview(res.data.data)
        else throw new Error(res.data.message || 'Không xem trước được đơn')
      } catch (error) {
        const code = error.response?.data?.errorCode
        const msg =
          code === 'EMAIL_NOT_VERIFIED'
            ? 'Vui lòng xác nhận email trước khi đặt hàng.'
            : error.response?.data?.message || error.message
        toast.warning(msg || 'Không tải được phí ship / dự kiến giao.')
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 380)

    return () => clearTimeout(previewTimer.current)
  }, [selectedAddress, orderItemsPayload])

  useEffect(() => {
    const allowed = preview?.availablePaymentMethods
    if (!allowed?.length) return
    if (!allowed.includes(method)) {
      if (allowed.includes('cod')) setMethod('cod')
      else if (allowed.includes('stripe')) setMethod('stripe')
    }
  }, [preview, method])

  const paymentOptions = useMemo(() => {
    const all = [
      {
        key: 'stripe',
        label: 'Thẻ quốc tế (Stripe)',
        icon: <img src={assets.stripe_logo} className="h-5" alt="stripe" />,
      },
      {
        key: 'cod',
        label: 'Thanh toán khi nhận hàng (COD)',
        icon: (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ]
    const allow = preview?.availablePaymentMethods
    if (!allow?.length) return all
    return all.filter((o) => allow.includes(o.key))
  }, [preview])

  const handleAddAddress = async (formData) => {
    try {
      const res = await addAddressV3(formData)
      if (!res.data.success) throw new Error(res.data.message)
      toast.success('Đã thêm địa chỉ mới')
      setShowAddAddressForm(false)
      setShowAddressPopup(false)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể thêm địa chỉ')
    }
  }

  const onSubmitHandler = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!selectedAddress) {
      toast.warning('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    if (!preview) {
      toast.warning('Chưa có dữ liệu xem trước đơn. Đợi vài giây hoặc kiểm tra email và địa chỉ GHN.')
      return
    }
    setPlacing(true)

    const body = { addressId: selectedAddress._id, orderItems: orderItemsPayload }

    try {
      if (method === 'cod') {
        const response = await placeOrderCod(body)
        if (response.status === 401) {
          navigate('/login')
          return
        }
        if (!response.data.success) {
          const code = response.data.errorCode
          if (code === 'EMAIL_NOT_VERIFIED') {
            toast.error('⚠️ Vui lòng xác nhận email trước khi đặt hàng. Kiểm tra hộp thư của bạn.')
          } else {
            toast.error(response.data.message)
          }
          return
        }
        toast.success(response.data.message ?? 'Đặt hàng thành công')
        queryClient.setQueryData(['cart'], {})
        navigate('/orders')
      } else if (method === 'stripe') {
        const response = await placeOrderStripe(body)
        if (!response.data.success) {
          const code = response.data.errorCode
          if (code === 'EMAIL_NOT_VERIFIED') {
            toast.error('⚠️ Vui lòng xác nhận email trước khi đặt hàng.')
          } else {
            toast.error(response.data.message || 'Không tạo được phiên thanh toán')
          }
          return
        }
        const sessionUrl = response.data?.data?.session_url
        if (!sessionUrl) {
          toast.error('Thiếu link thanh toán Stripe')
          return
        }
        try {
          sessionStorage.setItem('stripeCheckoutFromCart', fromCartCheckout ? 'true' : 'false')
        } catch {
          /* ignore */
        }
        window.location.replace(sessionUrl)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div
      onKeyDown={(e) => e.key === 'Enter' && onSubmitHandler(e)}
      className="flex flex-col lg:flex-row justify-between gap-8 pt-5 sm:pt-14 min-h-[80vh] border-t px-4 md:px-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col gap-6 w-full lg:w-2/3">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <Title text1="Thông Tin" text2="Sản Phẩm" />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {selectedCartItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-xl p-3 hover:shadow-sm transition-shadow"
              >
                <ProductRow
                  image={item.image}
                  name={item.name}
                  productId={item.id}
                  price={item.price}
                  quantity={item.quantity}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <Title text1="Địa Chỉ" text2="Giao Hàng" />
          </div>
          {selectedAddress ? (
            <div
              className="rounded-xl p-4"
              style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold" style={{ color: '#1E1B4B' }}>
                    {selectedAddress.fullName}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: '#4F46E5' }}>
                    {selectedAddress.phone}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">{formatAddressLine(selectedAddress)}</p>
                  {selectedAddress.lat && selectedAddress.lng && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${selectedAddress.lat}&mlon=${selectedAddress.lng}#map=16/${selectedAddress.lat}/${selectedAddress.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1.5 inline-flex items-center gap-1 hover:underline"
                      style={{ color: '#6366F1' }}
                    >
                      📍 Xem trên bản đồ
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressPopup(true)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: '#4F46E5', color: '#fff' }}
                >
                  Thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-center py-10 rounded-xl"
              style={{ background: '#F5F4FF', border: '2px dashed #DDD6FE' }}
            >
              <p className="text-gray-500 mb-3">Chưa có địa chỉ giao hàng</p>
              <button
                type="button"
                onClick={() => setShowAddressPopup(true)}
                className="px-5 py-2 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}
              >
                Chọn địa chỉ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24 space-y-6">
          {previewLoading && (
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
              Đang cập nhật phí ship và thời gian giao…
            </p>
          )}

          <CartTotal items={selectedCartItems} preview={preview} />

          <div>
            <Title text1="Phương Thức" text2="Thanh Toán" />
            <p className="text-xs text-gray-500 mt-1">
              Theo API chỉ COD và Stripe được hỗ trợ trong luồng V3. Sau COD/Stripe, đơn vẫn chờ cửa hàng xử lý giao GHN (api_v3_docs).
            </p>
            <div className="flex flex-col gap-3 mt-3">
              {paymentOptions.map(({ key, label, icon }) => (
                <div
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    method === key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(ev) =>
                    ev.key === 'Enter' && setMethod(key)
                  }
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      method === key ? 'border-indigo-500' : 'border-gray-300'
                    }`}
                  >
                    {method === key && (
                      <div className="w-3 h-3 rounded-full" style={{ background: '#4F46E5' }} />
                    )}
                  </div>
                  {icon}
                  <span className="font-medium text-gray-700 text-sm flex-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmitHandler}
            disabled={!selectedAddress || placing || previewLoading || !preview}
            className="w-full py-4 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : selectedAddress && !preview ? (
              previewLoading ? 'Đang tính toán đơn...' : 'Không có dữ liệu xem trước — kiểm tra email & địa chỉ GHN'
            ) : selectedAddress ? (
              '🛍️ Đặt hàng ngay'
            ) : (
              'Chọn địa chỉ để tiếp tục'
            )}
          </button>
        </div>
      </div>

      {showAddressPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div
              className="flex justify-between items-center p-5 border-b"
              style={{ background: 'linear-gradient(135deg,#F5F4FF,#EEF2FF)' }}
            >
              <h3 className="text-base font-bold" style={{ color: '#1E1B4B' }}>
                {showAddAddressForm ? '➕ Thêm địa chỉ mới' : '📍 Chọn địa chỉ giao hàng'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddressPopup(false)
                  setShowAddAddressForm(false)
                }}
                className="w-8 h-8 rounded-full hover:bg-indigo-100 transition-colors flex items-center justify-center text-gray-500 text-xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {!showAddAddressForm ? (
                <>
                  {user?.addresses?.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Chưa có địa chỉ. Thêm địa chỉ mới.</p>
                  ) : (
                    <div className="space-y-3">
                      {user?.addresses?.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => {
                            setSelectedAddress(address)
                            setShowAddressPopup(false)
                          }}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddress?._id === address._id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{address.fullName}</p>
                                {address.isDefault && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: '#EEF2FF', color: '#4F46E5' }}
                                  >
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">{address.phone}</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {formatAddressLine(address)}
                              </p>
                            </div>
                            {selectedAddress?._id === address._id && (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: '#4F46E5' }}
                              >
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(true)}
                    className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: '2px dashed #DDD6FE', color: '#4F46E5', background: '#F5F4FF' }}
                  >
                    + Thêm địa chỉ mới
                  </button>
                </>
              ) : (
                <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddAddressForm(false)} />
              )}
            </div>

            {!showAddAddressForm && (
              <div className="border-t p-4 flex justify-end gap-3" style={{ background: '#F9FAFB' }}>
                <button
                  type="button"
                  onClick={() => setShowAddressPopup(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceOrder
