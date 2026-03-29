import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from "../components/Title"
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartItems, updateQuantity, navigate } = useShopContext();
  const [cartData, setCartData] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const tempData = [];
    for (const productId in cartItems) {
      tempData.push(cartItems[productId]);
    }
    setCartData(tempData)
    // Auto-select all items on first load
    if (tempData.length > 0 && selectedItems.size === 0) {
      setSelectedItems(new Set(tempData.map(item => item.id)))
    }
  }, [cartItems]);

  const toggleSelectItem = (productId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === cartData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartData.map(item => item.id)));
    }
  };

  const handleBuySelected = () => {
    if (selectedItems.size === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để mua');
      return;
    }
    navigate("/place-order", { state: { selectedItems: Array.from(selectedItems) } });
  };

  const selectedTotal = cartData
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartData.length === 0) {
    return (
      <div className='border-t pt-14 pb-20'>
        <div className='text-2xl mb-8'>
          <Title text1="Giỏ Hàng" text2="Của Bạn" />
        </div>
        <div className='text-center py-20 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200'>
          <svg className='w-20 h-20 text-slate-300 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10-9l2 9m-9 0h18m-18 0a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z' />
          </svg>
          <p className='text-lg font-semibold text-slate-600 mb-2'>Giỏ hàng trống</p>
          <p className='text-slate-500 mb-6'>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
          <button 
            onClick={() => navigate("/collection")}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='border-t pt-10 pb-20 bg-gradient-to-b from-white via-slate-50/30 to-white'>
      <div className='text-2xl mb-8'>
        <Title text1="Giỏ Hàng" text2="Của Bạn" />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Products Section */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
            {/* Header */}
            <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200'>
              <input 
                type="checkbox" 
                checked={selectedItems.size === cartData.length && cartData.length > 0}
                onChange={selectAll}
                className='w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer'
              />
              <p className='font-semibold text-slate-700'>
                {selectedItems.size}/{cartData.length} sản phẩm được chọn
              </p>
            </div>

            {/* Items */}
            <div className='divide-y divide-slate-200'>
              {cartData.map((productData, index) => (
                <div 
                  key={index} 
                  className='p-4 hover:bg-blue-50/30 transition-colors flex gap-4'
                >
                  <div className='flex-shrink-0 pt-1'>
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(productData.id)}
                      onChange={() => toggleSelectItem(productData.id)}
                      className='w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer'
                    />
                  </div>
                  
                  <img className='w-20 h-20 object-cover rounded-lg border border-slate-200' src={productData.image} alt="" />
                  
                  <div className='flex-1'>
                    <p className='font-medium text-slate-900 mb-1'>
                      <Link to={`/product/${productData.id}`} className='hover:text-blue-600 transition-colors'>
                        {productData.name}
                      </Link>
                    </p>
                    <p className='text-lg font-bold text-blue-600'>
                      {productData.price.toLocaleString('vi-VN')} ₫
                    </p>
                    <div className='flex items-center gap-3 mt-3'>
                      <div className='flex items-center border border-slate-300 rounded-lg'>
                        <button 
                          onClick={() => updateQuantity(productData.id, productData.quantity - 1)}
                          className='px-2 py-1 hover:bg-slate-100'
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          value={productData.quantity}
                          onChange={(e) => e.target.value && updateQuantity(productData.id, Number(e.target.value))}
                          className='w-12 text-center border-l border-r border-slate-300 py-1 outline-none'
                        />
                        <button 
                          onClick={() => updateQuantity(productData.id, productData.quantity + 1)}
                          className='px-2 py-1 hover:bg-slate-100'
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => updateQuantity(productData.id, 0)}
                        className='ml-auto px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className='lg:col-span-1'>
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 sticky top-24 shadow-sm'>
            <h3 className='font-bold text-lg text-slate-900 mb-4'>Tóm tắt đơn hàng</h3>
            
            <div className='space-y-3 mb-6 pb-6 border-b border-blue-200'>
              <div className='flex justify-between text-slate-700'>
                <span>Sản phẩm chọn:</span>
                <span className='font-semibold'>{selectedItems.size}</span>
              </div>
              <div className='flex justify-between text-slate-700'>
                <span>Tạm tính:</span>
                <span className='font-semibold text-blue-600'>
                  {selectedTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className='flex justify-between text-slate-700'>
                <span>Vận chuyển:</span>
                <span className='font-semibold'>20.000 ₫</span>
              </div>
            </div>

            <div className='flex justify-between mb-6 text-lg'>
              <span className='font-bold text-slate-900'>Tổng cộng:</span>
              <span className='font-bold text-blue-600'>
                {(selectedTotal + 20000).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <button 
              onClick={handleBuySelected}
              disabled={selectedItems.size === 0}
              className='w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            >
              Mua {selectedItems.size > 0 ? selectedItems.size : ''} sản phẩm
            </button>

            <button 
              onClick={() => navigate("/collection")}
              className='w-full mt-3 border-2 border-slate-300 text-slate-700 font-semibold py-2 rounded-xl hover:bg-slate-50 transition-colors'
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
