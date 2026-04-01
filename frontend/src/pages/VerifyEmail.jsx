// frontend/src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import useShopContext from '../hooks/useShopContext'

const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const { backendUrl, my } = useShopContext()
    const [status, setStatus] = useState('loading') // loading | success | error
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) { setStatus('error'); setMessage('Link không hợp lệ'); return }

        axios.get(`${backendUrl}/api/v2/auth/verify-email?token=${token}`)
            .then(res => {
                if (res.data.success) {
                    setStatus('success')
                    setMessage(res.data.message)
                    my() // Refresh user state
                } else {
                    setStatus('error')
                    setMessage(res.data.message)
                }
            })
            .catch(err => {
                setStatus('error')
                setMessage(err.response?.data?.message || 'Có lỗi xảy ra')
            })
    }, [])

    return (
        <div className='min-h-[60vh] flex items-center justify-center px-4'>
            <div className='max-w-md w-full text-center'>
                {status === 'loading' && (
                    <div className='space-y-4'>
                        <div className='w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto' />
                        <p className='text-gray-600 font-medium'>Đang xác nhận email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className='rounded-2xl p-8 shadow-lg' style={{ border: '1.5px solid #D1FAE5', background: '#F0FDF4' }}>
                        <div className='w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4'
                            style={{ background: '#DCFCE7' }}>
                            <span className='text-4xl'>✅</span>
                        </div>
                        <h1 className='text-2xl font-bold mb-2' style={{ color: '#065F46' }}>Xác nhận thành công!</h1>
                        <p className='mb-6' style={{ color: '#059669' }}>{message}</p>
                        <Link to='/collection'
                            className='inline-block px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90'
                            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
                            Mua sắm ngay →
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className='rounded-2xl p-8 shadow-lg' style={{ border: '1.5px solid #FEE2E2', background: '#FFF5F5' }}>
                        <div className='w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4'
                            style={{ background: '#FEE2E2' }}>
                            <span className='text-4xl'>❌</span>
                        </div>
                        <h1 className='text-2xl font-bold mb-2' style={{ color: '#991B1B' }}>Xác nhận thất bại</h1>
                        <p className='mb-6' style={{ color: '#DC2626' }}>{message}</p>
                        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                            <Link to='/login'
                                className='px-5 py-2.5 rounded-xl text-white font-semibold'
                                style={{ background: '#EF4444' }}>
                                Đăng nhập lại
                            </Link>
                            <Link to='/'
                                className='px-5 py-2.5 rounded-xl font-semibold'
                                style={{ background: '#F3F4F6', color: '#374151' }}>
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerifyEmail
