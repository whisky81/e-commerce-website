import React, { useEffect, useCallback } from 'react'
import useShopContext from '../hooks/useShopContext'
import { toast } from 'react-toastify'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const Verify = () => {
    const { setCartItems } = useShopContext()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = useCallback(async () => {
        try {
            const response = await api.post('/api/orders/verify-stripe', { orderId, success })
            if (response.data.success) {
                toast.success(response.data.message)
                setCartItems({})
                navigate('/orders')
            } else {
                toast.error(response.data.message)
                navigate('/cart')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            navigate('/cart')
        }
    }, [orderId, success, navigate, setCartItems])

    useEffect(() => {
        verifyPayment()
    }, [verifyPayment])

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="text-gray-600 font-medium">Đang xác nhận thanh toán...</p>
            </div>
        </div>
    )
}

export default Verify
