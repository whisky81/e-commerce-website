import React, { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { verifyStripeCheckout } from '../api/orders'

const Verify = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const success = searchParams.get('success')
  const orderId = searchParams.get('orderId')
  const method = searchParams.get('method')

  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const verifyPayment = async () => {
      if (!orderId) {
        toast.error('Thiếu thông tin đơn hàng')
        navigate('/cart')
        return
      }

      let fromCart = searchParams.get('fromCart')
      if (fromCart == null) {
        try {
          fromCart = sessionStorage.getItem('stripeCheckoutFromCart')
          sessionStorage.removeItem('stripeCheckoutFromCart')
        } catch {
          fromCart = 'true'
        }
      }

      try {
        const response = await verifyStripeCheckout({
          orderId,
          success: success === 'true' ? 'true' : 'false',
          fromCart: fromCart === 'false' ? 'false' : 'true',
        })
        if (response.data.success) {
          toast.success(response.data.message)
          queryClient.setQueryData(['cart'], {})
          navigate('/orders')
        } else {
          toast.error(response.data.message || 'Xác nhận thanh toán thất bại')
          navigate('/cart')
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
        navigate('/cart')
      }
    }

    if (method && method !== 'stripe') {
      navigate('/orders')
      return
    }

    verifyPayment()
  }, [success, orderId, method, navigate, queryClient, searchParams])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 font-medium">
          Đang xác nhận thanh toán {method === 'stripe' ? 'Stripe' : ''}...
        </p>
      </div>
    </div>
  )
}

export default Verify
