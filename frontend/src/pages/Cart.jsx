import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from "../components/Title"
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { Link } from 'react-router-dom';
const Cart = () => {
  const { cartItems, updateQuantity, navigate } = useShopContext();
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    const tempData = [];
    for (const productId in cartItems) {
      tempData.push(cartItems[productId]);
    }
    setCartData(tempData)
  }, [cartItems]);
  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-3'>
        <Title text1="Giỏ Hàng" text2="Của Bạn" />
      </div>

      <div>
        {
          cartData.map((productData, index) => {
            return (
              <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                <div className='flex items-start gap-6'>
                  <img className='w-16 sm:w-20' src={productData.image} alt="" />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'><Link to={`/product/${productData.id}`}>{productData.name}</Link></p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p>{productData.price.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                </div>
                <input onChange={
                  (e) => e.target.value === '' || e.target.value === '0' ? null : updateQuantity(productData.id, Number(e.target.value))} type="number" min={1} defaultValue={productData.quantity} className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' />
                <img className='w-4 mr-4 cursor-pointer sm:w-5' src={assets.bin_icon} alt="" onClick={() => updateQuantity(productData.id, 0)} />
              </div>
            );
          })
        }
      </div>
      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-112.5'>
          <CartTotal />
          <div className='w-full text-end'>
            <button onClick={() => navigate("/place-order")} className='bg-black text-white text-sm my-8 px-8 py-3'>Mua ngay</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
