import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title';

const CartTotal = () => {
    const { cartAmount, deliveryFee } = useShopContext();
    const [fee, setFee] = useState({
        amount: 0,
        shipping: deliveryFee,
        total: 0
    })

    useEffect(() => {
        const tmp = cartAmount();
        const amount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(tmp);

        const shipping = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(deliveryFee);

        const total = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(cartAmount(tmp === 0 ? 0 : tmp + deliveryFee));

        setFee({
            amount,
            shipping,
            total
        })
    }, [cartAmount()]);

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'Giỏ hàng'} text2={'Tổng tiền'} />
            </div>
            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p>Tạm tính</p>
                    <p>{fee.amount}</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p>Phí vận chuyển</p>
                    <p>{fee.shipping}</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p>Tổng cộng</p>
                    <p>{fee.total}</p>
                </div>
            </div>
        </div>
    )
}

export default CartTotal