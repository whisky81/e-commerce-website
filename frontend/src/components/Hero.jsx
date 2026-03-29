import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const Hero = () => {
    return (
        <div className='flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-gradient-to-br from-white to-slate-100'>
            <div className='w-full sm:w-1/2 flex items-center justify-center py-12 sm:py-16'>
                <div className='text-[#414141] px-4 sm:px-10'>
                    <div className='flex items-center gap-2 mb-4'>
                        <div className='w-8 md:w-11 h-0.5 bg-[#414141]'></div>
                        <p className='font-medium text-base md:text-lg'>Sản phẩm bán chạy</p>
                    </div>
                    <h1 className='prata-regular text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight'>Hàng mới về</h1>
                    <Link to="/collection" className='inline-flex items-center gap-2 cursor-pointer group'>
                        <span className='font-semibold text-base md:text-lg group-hover:underline'>Mua sắm ngay</span>
                        <div className='w-8 md:w-11 h-px bg-[#414141] group-hover:w-12 transition-all duration-300'></div>
                    </Link>
                </div>
            </div>
            <div className='w-full sm:w-1/2 min-h-[220px] sm:min-h-0'>
                <img
                    src={assets.hero2}
                    alt="Banner cửa hàng"
                    className='w-full h-full min-h-[280px] object-cover'
                />
            </div>
        </div>
    )
}

export default Hero