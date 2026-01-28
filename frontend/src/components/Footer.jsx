import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='mt-40 mb-10'>
            <div className='flex flex-col sm:grid sm:grid-cols-3 gap-10 text-sm'>
                <div className='sm:col-span-2 lg:col-span-1'>
                    <img src={assets.logo} alt="logo image" className='mb-5 w-32' />
                    <p className='w-full lg:w-2/3 text-gray-600 leading-relaxed'>
                        abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc
                    </p>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>Company</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Home</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>About us</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Delivery</li>
                        <li className='cursor-pointer hover:text-gray-800 transition-colors'>Privacy policy</li>
                    </ul>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>Get In Touch</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>0123456789</li>
                        <li>whisky@abc.com</li>
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