// admin/src/pages/Marketing.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const Marketing = () => {
  const [tab, setTab] = useState('discount')   // 'discount' | 'email'
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)

  // Discount form
  const [discount,    setDiscount]    = useState(10)
  const [saleStartAt, setSaleStartAt] = useState('')
  const [saleEndAt,   setSaleEndAt]   = useState('')

  // Email form
  const [emailSubject, setEmailSubject] = useState('🔥 Ưu đãi đặc biệt từ ABC Shop!')
  const [promoCode,    setPromoCode]    = useState('')
  const [sending,      setSending]      = useState(false)

  useEffect(() => {
    axios.get(backendUrl + '/api/v2/products/admin', { withCredentials: true })
      .then(r => { if (r.data.success) setProducts(r.data.data) })
  }, [])

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () => setSelected(selected.length === products.length ? [] : products.map(p => p._id))

  const applyDiscount = async () => {
    setLoading(true)
    try {
      const res = await axios.post(backendUrl + '/api/v2/marketing/bulk-discount', {
        productIds: selected.length ? selected : undefined,
        discount, saleStartAt: saleStartAt || undefined, saleEndAt: saleEndAt || undefined,
      }, { withCredentials: true })
      if (res.data.success) { toast.success(res.data.message); setSelected([]) }
      else throw new Error(res.data.message)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const removeDiscount = async () => {
    setLoading(true)
    try {
      const res = await axios.post(backendUrl + '/api/v2/marketing/remove-discount', {
        productIds: selected.length ? selected : undefined,
      }, { withCredentials: true })
      if (res.data.success) { toast.success(res.data.message); setSelected([]) }
      else throw new Error(res.data.message)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const sendPromo = async () => {
    setSending(true)
    try {
      const res = await axios.post(backendUrl + '/api/v2/marketing/send-promo', {
        subject: emailSubject,
        promoCode: promoCode || undefined,
        productIds: selected.length ? selected : undefined,
      }, { withCredentials: true })
      if (res.data.success) toast.success(res.data.message)
      else throw new Error(res.data.message)
    } catch (e) { toast.error(e.message) }
    finally { setSending(false) }
  }

  const CARD = ({ children, style }) => (
    <div className='rounded-2xl p-5' style={{ background: '#fff', border: '1.5px solid #DDD6FE', ...style }}>{children}</div>
  )
  const LBL = ({ children }) => (
    <p className='text-xs font-semibold mb-1.5' style={{ color: '#4F46E5' }}>{children}</p>
  )

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-xl font-bold' style={{ color: '#1E1B4B' }}>Tiếp thị & Khuyến mãi</h1>
        <p className='text-sm mt-0.5' style={{ color: '#9CA3AF' }}>Quản lý discount và gửi email marketing tự động</p>
      </div>

      {/* Tabs */}
      <div className='flex gap-2'>
        {[['discount','🔥 Quản lý Discount'], ['email','✉️ Email Marketing']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className='px-4 py-2 rounded-xl text-sm font-semibold transition-all'
            style={{ background: tab === k ? '#4F46E5' : '#EEF2FF', color: tab === k ? '#fff' : '#4F46E5' }}>
            {l}
          </button>
        ))}
      </div>

      <div className='grid lg:grid-cols-3 gap-6'>
        {/* Product selector */}
        <div className='lg:col-span-2'>
          <CARD>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm font-bold' style={{ color: '#1E1B4B' }}>
                Chọn sản phẩm {selected.length > 0 && <span className='ml-1 px-2 py-0.5 rounded-full text-xs' style={{ background: '#EEF2FF', color: '#4F46E5' }}>{selected.length}</span>}
              </p>
              <button onClick={toggleAll} className='text-xs font-semibold' style={{ color: '#4F46E5' }}>
                {selected.length === products.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className='max-h-96 overflow-y-auto space-y-2 pr-1'>
              {products.map(p => (
                <div key={p._id} onClick={() => toggleSelect(p._id)}
                  className='flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all'
                  style={{
                    border: `1.5px solid ${selected.includes(p._id) ? '#4F46E5' : '#EDE9FE'}`,
                    background: selected.includes(p._id) ? '#EEF2FF' : '#FAFAFF'
                  }}>
                  <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${selected.includes(p._id) ? 'bg-indigo-600' : 'border-2 border-slate-300'}`}>
                    {selected.includes(p._id) && <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' /></svg>}
                  </div>
                  <img src={p.images?.[0]} alt='' className='w-10 h-10 rounded-lg object-cover flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold truncate' style={{ color: '#1E1B4B' }}>{p.name}</p>
                    <p className='text-xs' style={{ color: '#9CA3AF' }}>{fmt(p.price)}</p>
                  </div>
                  {p.discount > 0 && (
                    <span className='text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0'
                      style={{ background: '#FEE2E2', color: '#EF4444' }}>-{p.discount}%</span>
                  )}
                </div>
              ))}
            </div>
            {selected.length === 0 && (
              <p className='text-xs mt-2' style={{ color: '#9CA3AF' }}>
                * Nếu không chọn sản phẩm nào, thao tác sẽ áp dụng cho TẤT CẢ sản phẩm
              </p>
            )}
          </CARD>
        </div>

        {/* Action panel */}
        <div className='space-y-5'>
          {tab === 'discount' && (
            <>
              <CARD style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
                <p className='text-sm font-bold mb-4' style={{ color: '#92400E' }}>🔥 Áp dụng Discount</p>
                <div className='space-y-3'>
                  <div>
                    <LBL>Giảm giá (%)</LBL>
                    <div className='flex items-center gap-2'>
                      <input type='range' min={0} max={90} step={5} value={discount}
                        onChange={e => setDiscount(Number(e.target.value))} className='flex-1 accent-amber-500' />
                      <span className='text-lg font-bold w-12 text-center' style={{ color: '#92400E' }}>{discount}%</span>
                    </div>
                  </div>
                  <div>
                    <LBL>Bắt đầu (tuỳ chọn)</LBL>
                    <input type='datetime-local' value={saleStartAt} onChange={e => setSaleStartAt(e.target.value)}
                      className='w-full px-3 py-2 text-xs rounded-xl' style={{ border: '1.5px solid #FDE68A', background: '#fff' }} />
                  </div>
                  <div>
                    <LBL>Kết thúc (tuỳ chọn)</LBL>
                    <input type='datetime-local' value={saleEndAt} onChange={e => setSaleEndAt(e.target.value)}
                      className='w-full px-3 py-2 text-xs rounded-xl' style={{ border: '1.5px solid #FDE68A', background: '#fff' }} />
                  </div>
                  <button onClick={applyDiscount} disabled={loading}
                    className='w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50'
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                    {loading ? '...' : `🔥 Áp dụng ${discount}% cho ${selected.length || 'tất cả'}`}
                  </button>
                  <button onClick={removeDiscount} disabled={loading}
                    className='w-full py-2 rounded-xl text-sm font-semibold transition-all'
                    style={{ background: '#FEE2E2', color: '#EF4444' }}>
                    ✕ Xóa discount
                  </button>
                </div>
              </CARD>
            </>
          )}

          {tab === 'email' && (
            <CARD>
              <p className='text-sm font-bold mb-4' style={{ color: '#1E1B4B' }}>✉️ Gửi email marketing</p>
              <div className='space-y-3'>
                <div>
                  <LBL>Tiêu đề email</LBL>
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    className='w-full px-3 py-2 text-sm rounded-xl' style={{ border: '1.5px solid #DDD6FE', background: '#FAFAFF' }} />
                </div>
                <div>
                  <LBL>Mã giảm giá (tuỳ chọn)</LBL>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder='VD: SALE20' className='w-full px-3 py-2 text-sm font-mono rounded-xl tracking-widest'
                    style={{ border: '1.5px solid #DDD6FE', background: '#FAFAFF' }} />
                </div>
                <div className='p-3 rounded-xl text-xs' style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  💡 Email sẽ hiển thị sản phẩm đang có discount. Nếu không chọn sản phẩm, tự động lấy 6 sản phẩm đang sale.
                </div>
                <button onClick={sendPromo} disabled={sending}
                  className='w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50'
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                  {sending ? (
                    <span className='flex items-center justify-center gap-2'>
                      <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      Đang gửi...
                    </span>
                  ) : '✉️ Gửi email đến tất cả khách hàng'}
                </button>
              </div>
            </CARD>
          )}
        </div>
      </div>
    </div>
  )
}

export default Marketing
