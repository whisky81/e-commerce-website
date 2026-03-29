import React from 'react'
import { assets } from '../assets/assets'

const OurPolicy = () => {
    const policies = [
        {
            icon: assets.exchange_icon,
            title: 'Chính sách đổi trả dễ dàng',
            description: 'Chúng tôi cung cấp chính sách đổi trả nhanh chóng và tiện lợi cho khách hàng.'
        },
        {
            icon: assets.quality_icon,
            title: 'Chính sách hoàn trả trong 7 ngày',
            description: 'Hỗ trợ hoàn tiền trong vòng 7 ngày nếu sản phẩm gặp vấn đề.'
        },
        {
            icon: assets.support_img,
            title: 'Hỗ trợ khách hàng tốt nhất',
            description: 'Đội ngũ chăm sóc khách hàng trực tuyến 24/7, sẵn sàng hỗ trợ bạn mọi lúc.'
        }
    ];

    return (
        <div className='py-20 px-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
                {policies.map((policy, index) => (
                    <div
                        key={index}
                        className='group bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:border-blue-300 flex flex-col items-center text-center'
                    >
                        <div className='mb-6 p-4 rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors duration-300'>
                            <img 
                                src={policy.icon} 
                                alt="" 
                                className='w-12 h-12 object-contain opacity-80 group-hover:opacity-100 transition-opacity' 
                            />
                        </div>
                        
                        <h3 className='font-bold text-lg text-slate-900 mb-3 leading-tight'>
                            {policy.title}
                        </h3>
                        
                        <p className='text-slate-600 text-sm leading-relaxed'>
                            {policy.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default OurPolicy
