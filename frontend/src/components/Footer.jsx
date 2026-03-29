import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='mt-40 mb-10'>
            <div className='flex flex-col sm:grid sm:grid-cols-3 gap-10 text-base'>
                <div className='sm:col-span-2 lg:col-span-1'>
                    <img src={assets.logo} alt="logo image" className='mb-5 w-32' />
                    <p className='w-full lg:w-2/3 text-gray-600 leading-relaxed'>
                        Chúng tôi cung cấp các sản phẩm điện tử chính hãng với chất lượng đảm bảo và giá cả cạnh tranh, 
                        mang đến trải nghiệm mua sắm an toàn và tiện lợi cho khách hàng.
                    </p>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>Công ty</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Trang chủ</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Giới thiệu</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Giao hàng</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Chính sách bảo mật</li>
                    </ul>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>Liên hệ</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>0123456789</li>
                        <li>abcwhisky@gmail.com</li>
                    </ul>
                </div>
            </div>

            <hr className='my-10 border-gray-300' />
            <p className='text-sm text-center text-gray-500'>
                Copyright 2026@ abc.com - All Right Reserved.
            </p>
        </div>
    )
}

export default Footer