import React from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

/**
 * @param {{ items?: Array<{price:number, quantity:number}> }} props
 * When `items` is provided, totals are computed from that subset (e.g. selected cart items).
 * When omitted, falls back to the full global cart.
 */
const CartTotal = ({ items }) => {
    const { cartItems, deliveryFee } = useShopContext();

    // Use passed items (selected subset) or fall back to all cart items
    const cartData = items ?? Object.values(cartItems);
    const subtotal = cartData.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const total    = subtotal > 0 ? subtotal + deliveryFee : 0;

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'Giỏ hàng'} text2={'Tổng tiền'} />
            </div>
            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p className='text-gray-600'>Tạm tính</p>
                    <p className='font-medium'>{fmt(subtotal)}</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p className='text-gray-600'>Phí vận chuyển</p>
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
