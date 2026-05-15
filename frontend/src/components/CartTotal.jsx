import React from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

/**
 * Cart total summary component.
 *
 * Two modes:
 * 1. EXTERNAL (props.subtotal is provided): renders the passed values directly.
 *    Used by PlayOrder when preview API has already calculated shipping + total.
 * 2. INTERNAL (props.items or falls back to context): computes from cart data.
 *    Used by Cart page.
 *
 * @param {object}  props
 * @param {Array}  [props.items]        Cart items subset (optional)
 * @param {number} [props.subtotal]     Pre-computed subtotal (external mode)
 * @param {number} [props.shippingFee]  Pre-computed shipping fee (external mode)
 * @param {number} [props.total]        Pre-computed total (external mode)
 * @param {number} [props.discount]     Pre-computed discount (external mode)
 */
const CartTotal = ({ items, subtotal: extSubtotal, shippingFee: extShippingFee, total: extTotal, discount: extDiscount }) => {
    const { cartItems, deliveryFee } = useShopContext();

    // ── External mode: caller already calculated everything ────────────────
    const isExternal = extSubtotal !== undefined || extTotal !== undefined;

    if (isExternal) {
        const sub = extSubtotal ?? 0;
        const ship = extShippingFee ?? deliveryFee;
        const tot = extTotal ?? sub + ship;
        const disc = extDiscount ?? 0;

        return (
            <div className='w-full'>
                <div className='text-2xl'>
                    <Title text1={'Đơn Hàng'} text2={'Tổng Tiền'} />
                </div>
                <div className='flex flex-col gap-2 mt-2 text-sm'>
                    <div className='flex justify-between'>
                        <p className='text-slate-600'>Tạm tính</p>
                        <p className='font-medium'>{fmt(sub)}</p>
                    </div>
                    {disc > 0 && (
                        <div className='flex justify-between'>
                            <p className='text-emerald-600'>Giảm giá</p>
                            <p className='font-medium text-emerald-600'>-{fmt(disc)}</p>
                        </div>
                    )}
                    <hr />
                    <div className='flex justify-between'>
                        <p className='text-slate-600'>Phí vận chuyển</p>
                        <p className='font-medium'>{sub > 0 ? fmt(ship) : '—'}</p>
                    </div>
                    <hr />
                    <div className='flex justify-between font-semibold text-base'>
                        <p>Tổng cộng</p>
                        <p className='text-indigo-600'>{fmt(tot)}</p>
                    </div>
                </div>
            </div>
        )
    }

    // ── Internal mode: compute from items / cart context ───────────────────
    const cartData = items ?? Object.values(cartItems);
    const subtotal = cartData.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const originalSubtotal = cartData.reduce((acc, item) => acc + item.quantity * (item.originalPrice || item.price), 0);
    const total    = subtotal > 0 ? subtotal + deliveryFee : 0;
    const savings  = originalSubtotal - subtotal;

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'Giỏ Hàng'} text2={'Tổng Tiền'} />
            </div>
            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p className='text-slate-600'>Tạm tính</p>
                    <p className='font-medium'>{fmt(subtotal)}</p>
                </div>
                {savings > 0 && (
                    <div className='flex justify-between'>
                        <p className='text-emerald-600'>Tiết kiệm</p>
                        <p className='font-medium text-emerald-600'>-{fmt(savings)}</p>
                    </div>
                )}
                <hr />
                <div className='flex justify-between'>
                    <p className='text-slate-600'>Phí vận chuyển</p>
                    <p className='font-medium'>{subtotal > 0 ? fmt(deliveryFee) : '—'}</p>
                </div>
                <hr />
                <div className='flex justify-between font-semibold text-base'>
                    <p>Tổng cộng</p>
                    <p className='text-blue-600'>{fmt(total)}</p>
                </div>
            </div>
        </div>
    )
}

export default CartTotal
