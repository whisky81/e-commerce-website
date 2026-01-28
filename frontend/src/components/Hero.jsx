import React from 'react'
import { assets } from '../assets/assets'

const Hero = () => {
    return (
        <div className='flex flex-col sm:flex-row border border-gray-400'>
            <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
                <div className='text-[#414141] px-4 sm:px-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <div className='w-8 md:w-11 h-[2px] bg-[#414141]'></div>
                        <p className='font-medium text-sm md:text-base'>Our Best Sellers</p>
                    </div>
                    <h1 className='prata-regular text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight'>Latest Arrivals</h1>
                    <div className='flex items-center gap-2 cursor-pointer group'>
                        <p className='font-semibold text-sm md:text-base group-hover:underline'>Shop Now</p>
                        <div className='w-8 md:w-11 h-[1px] bg-[#414141] group-hover:w-12 transition-all duration-300'></div>
                    </div>
                </div>
            </div>
            <div className='w-full sm:w-1/2'>
                <img
                    src={assets.hero_img}
                    alt="hero image"
                    className='w-full h-full object-cover'
                />
            </div>
        </div>
    )
}

export default Hero