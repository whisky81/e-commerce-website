// frontend/src/components/EmailVerificationBanner.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import useShopContext from '../hooks/useShopContext'

const EmailVerificationBanner = () => {
    const { backendUrl, user, isAuthenticated } = useShopContext()
    const [sending, setSending] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    if (!isAuthenticated || !user || user.isEmailVerified || dismissed) return null

    const resend = async () => {
        setSending(true)
        try {
            const res = await axios.post(backendUrl + '/api/auth/resend-verification', {}, { withCredentials: true })
            if (res.data.success) toast.success(res.data.message)
            else throw new Error(res.data.message)
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', color: '#fff' }}
            className='flex items-center justify-between px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] py-2.5 gap-3 flex-wrap'>
            <div className='flex items-center gap-2 text-sm'>
                <span>⚠️</span>
                <span>Email chưa được xác nhận. Vui lòng kiểm tra hộp thư để xác nhận tài khoản.</span>
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
                <button
                    onClick={resend}
                    disabled={sending}
                    className='text-xs font-semibold px-3 py-1 rounded-lg transition-all disabled:opacity-60'
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
                >
                    {sending ? '...' : '📧 Gửi lại email'}
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className='text-white/70 hover:text-white text-lg leading-none'
                    aria-label='Đóng'
                >×</button>
            </div>
        </div>
    )
}

export default EmailVerificationBanner
