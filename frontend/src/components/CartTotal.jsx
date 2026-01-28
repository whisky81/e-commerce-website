import React from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title';
const CartTotal = () => {
    const {cartAmount,deliveryFee, currency} = useShopContext();
    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'Cart'} text2={'Total'}/>
            </div>
            <div className='flex flex-col gap-2 mt-2 text-sm'>
                <div className='flex justify-between'>
                    <p>Subtotal</p>
                    <p>{currency} {cartAmount()}</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p>Shipping Fee</p>
                    <p>{currency} {deliveryFee}</p>
                </div>
                <hr />
                <div className='flex justify-between'>
                    <p>Total</p>
                    <p>{currency} {cartAmount() === 0 ? 0 : cartAmount() + deliveryFee}</p>
                </div>
            </div>
        </div>
    )
}

export default CartTotal
