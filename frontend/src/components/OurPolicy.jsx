import React from 'react'
import { assets } from '../assets/assets'
const OurPolicy = () => {
    return (
        <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700'>
            <div>
                <img src={assets.exchange_icon} alt="exchange icon" className='w-12 m-auto mb-5' />
                <p className='font-semibold'>Chính sách đổi trả dễ dàng</p>
                <p className='text-gray-400'>Chúng tôi cung cấp chính sách đổi trả nhanh chóng và tiện lợi cho khách hàng.</p>
            </div>

            <div>
                <img src={assets.quality_icon} alt="exchange icon" className='w-12 m-auto mb-5' />
                <p className='font-semibold'>Chính sách hoàn trả trong 7 ngày</p>
                <p className='text-gray-400'>Hỗ trợ hoàn tiền trong vòng 7 ngày nếu sản phẩm gặp vấn đề.</p>
            </div>

            <div>
                <img src={assets.support_img} alt="exchange icon" className='w-12 m-auto mb-5' />
                <p className='font-semibold'>Hỗ trợ khách hàng tốt nhất</p>
                <p className='text-gray-400'>Đội ngũ chăm sóc khách hàng trực tuyến 24/7, sẵn sàng hỗ trợ bạn mọi lúc.</p>
            </div>
        </div>
    )
}

export default OurPolicy
