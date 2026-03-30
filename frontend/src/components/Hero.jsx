import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import useShopContext from '../hooks/useShopContext'

const Hero = () => {
    const { setting } = useShopContext();
    return (
        <div className='flex flex-col sm:flex-row rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-white hover:shadow-xl transition-shadow duration-300'>
            <div className='w-full sm:w-1/2 flex items-center justify-center py-12 sm:py-16 px-6 sm:px-10'>
                <div className='text-slate-900 max-w-md'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-12 h-0.5 bg-slate-900'></div>
                        <p className='font-semibold text-sm md:text-base text-slate-700 tracking-wide uppercase'>Xu hướng mới</p>
                    </div>
                    <h1 className='prata-regular text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-slate-900'>
                        {setting.banner?.name || "Sản phẩm bán chạy"}
                    </h1>
                    <p className='text-slate-600 mb-8 text-sm md:text-base leading-relaxed'>
                        Khám phá bộ sưu tập điện tử mới nhất với công nghệ tiên tiến và giá cả cạnh tranh.
                    </p>
                    <Link 
                        to="/collection" 
                        className='inline-flex items-center gap-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-1 py-1'
                    >
                        <span className='font-semibold text-base md:text-lg text-slate-900 group-hover:text-blue-600 transition-colors'>
                            Mua sắm ngay
                        </span>
                        <div className='w-8 md:w-11 h-0.5 bg-slate-900 group-hover:bg-blue-600 group-hover:w-12 transition-all duration-300'></div>
                    </Link>
                </div>
            </div>
            <div className='w-full sm:w-1/2 min-h-70 sm:min-h-0 overflow-hidden'>
                <img
                    src={setting.banner?.url || assets.hero2}
                    alt="Banner cửa hàng - Sản phẩm điện tử chất lượng"
                    className='w-full h-full min-h-70 object-cover hover:scale-105 transition-transform duration-300'
                />
            </div>
        </div>
    )
}

export default Hero
