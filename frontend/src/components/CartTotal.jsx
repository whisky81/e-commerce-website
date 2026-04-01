import React from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const CartTotal = () => {
    const { cartAmount, deliveryFee } = useShopContext();
    const subtotal = cartAmount();
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
