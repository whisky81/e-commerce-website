import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsLetterBox from '../components/NewsLetterBox'

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'>
        <Title text1={'Liên'} text2={'Hệ'} />
      </div>
      
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
        <img className='w-full md:max-w-120' src={assets.contact_img} alt="Liên hệ với chúng tôi" />
        
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600'>Cửa Hàng Của Chúng Tôi</p>
          <p className='text-gray-500'>
            123 Đường Công Nghệ, Phường Kỹ Thuật Số<br />
            Quận Hiện Đại, TP. Hồ Chí Minh
          </p>
          <p className='text-gray-500'>
            Điện thoại: 0123456789 <br /> 
            Email: abcwhisky@gmail.com
          </p>
          
          <p className="font-semibold text-xl text-gray-600">Tuyển Dụng Tại Điện Tử ABC</p>
          <p className='text-gray-500'>
            Gia nhập đội ngũ của chúng tôi để cùng phát triển và mang công nghệ đến gần hơn với mọi người.
          </p>
          
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>
            Khám Phá Cơ Hội Nghề Nghiệp
          </button>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  )
}

export default Contact