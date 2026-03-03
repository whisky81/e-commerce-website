import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsLetterBox from '../components/NewsLetterBox'

const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'Về'} text2={'Chúng Tôi'}></Title>
      </div>
      
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className="w-full md:max-w-112.5" src={assets.about_img} alt="Về chúng tôi" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>
            Chào mừng bạn đến với cửa hàng điện tử của chúng tôi - điểm đến tin cậy cho mọi nhu cầu công nghệ của bạn. 
            Với nhiều năm kinh nghiệm trong lĩnh vực điện tử tiêu dùng, chúng tôi tự hào mang đến những sản phẩm chất lượng 
            cao từ các thương hiệu hàng đầu thế giới.
          </p>
          <p>
            Đội ngũ nhân viên am hiểu công nghệ của chúng tôi luôn sẵn sàng tư vấn và hỗ trợ bạn chọn được sản phẩm phù hợp 
            nhất với nhu cầu sử dụng. Từ điện thoại thông minh, laptop, máy tính bảng đến các phụ kiện công nghệ mới nhất, 
            chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời với giá cả cạnh tranh.
          </p>
          <b className='text-gray-800'>Sứ Mệnh Của Chúng Tôi</b>
          <p>
            Sứ mệnh của chúng tôi là kết nối mọi người với công nghệ hiện đại thông qua các sản phẩm điện tử chất lượng, 
            dịch vụ chuyên nghiệp và giá trị bền vững. Chúng tôi không chỉ bán sản phẩm, mà còn mang đến giải pháp công 
            nghệ toàn diện cho cuộc sống và công việc của bạn.
          </p>
        </div>
      </div>

      <div className='text-xl py-4'>
        <Title text1={'Tại Sao Nên'} text2={'Chọn Chúng Tôi'}></Title>
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Chất Lượng Đảm Bảo:</b>
          <p className='text-gray-600'>
            Tất cả sản phẩm điện tử đều được kiểm tra nghiêm ngặt, chính hãng 100% từ các nhà sản xuất uy tín, 
            kèm chế độ bảo hành đầy đủ.
          </p>
        </div>
        
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Giá Cả Cạnh Tranh:</b>
          <p className='text-gray-600'>
            Chúng tôi cung cấp mức giá tốt nhất thị trường cùng nhiều chương trình khuyến mãi hấp dẫn, 
            giúp bạn sở hữu công nghệ mới với chi phí tiết kiệm.
          </p>
        </div>
        
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Dịch Vụ Chuyên Nghiệp:</b>
          <p className='text-gray-600'>
            Đội ngũ tư vấn am hiểu công nghệ, hỗ trợ nhiệt tình trước và sau bán hàng, 
            giao hàng nhanh chóng trên toàn quốc.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  )
}

export default About