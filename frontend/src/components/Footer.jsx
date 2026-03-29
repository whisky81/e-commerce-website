import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='mt-40 mb-10 border-t border-slate-200 pt-16'>
            <div className='flex flex-col sm:grid sm:grid-cols-3 gap-12 text-base mb-12'>
                {/* Column 1 - Logo & Description */}
                <div className='sm:col-span-1'>
                    <img src={assets.logo} alt="logo image" className='mb-6 w-32 hover:opacity-80 transition-opacity' />
                    <p className='w-full text-slate-600 leading-relaxed text-sm'>
                        Cung cấp sản phẩm điện tử chính hãng với chất lượng đảm bảo và giá cả cạnh tranh. 
                        Mang đến trải nghiệm mua sắm an toàn và tiện lợi cho khách hàng.
                    </p>
                </div>

                {/* Column 2 - Company Links */}
                <div>
                    <p className='text-lg font-bold text-slate-900 mb-6'>Công ty</p>
                    <ul className='flex flex-col gap-4 text-slate-600'>
                        <li>
                            <a 
                                href="/" 
                                className='hover:text-slate-900 hover:translate-x-1 transition-all duration-200 inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
                            >
                                Trang chủ
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/about" 
                                className='hover:text-slate-900 hover:translate-x-1 transition-all duration-200 inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
                            >
                                Giới thiệu
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/collection" 
                                className='hover:text-slate-900 hover:translate-x-1 transition-all duration-200 inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
                            >
                                Giao hàng
                            </a>
                        </li>
                        <li>
                            <a 
                                href="#" 
                                className='hover:text-slate-900 hover:translate-x-1 transition-all duration-200 inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
                            >
                                Chính sách bảo mật
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Column 3 - Contact */}
                <div>
                    <p className='text-lg font-bold text-slate-900 mb-6'>Liên hệ</p>
                    <ul className='flex flex-col gap-4 text-slate-600'>
                        <li className='flex items-center gap-3'>
                            <svg className='w-5 h-5 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.02.04.048.082.074.125 1.44 2.414 3.898 4.864 6.313 6.303.046.027.092.055.14.08l.774-1.559a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                            </svg>
                            <a href="tel:0123456789" className='hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'>
                                0123456789
                            </a>
                        </li>
                        <li className='flex items-center gap-3'>
                            <svg className='w-5 h-5 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                                <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                            </svg>
                            <a href="mailto:abcwhisky@gmail.com" className='hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'>
                                abcwhisky@gmail.com
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className='border-t border-slate-200 py-8'>
                <p className='text-sm text-center text-slate-500 hover:text-slate-700 transition-colors'>
                    Copyright 2026 © abc.com - Tất cả các quyền được bảo lưu.
                </p>
            </div>
        </div>
    )
}

export default Footer
