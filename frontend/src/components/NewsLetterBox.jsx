import React from 'react'

const NewsLetterBox = () => {
    const onSubmitHandler = (e) => {
        e.preventDefault();
    }
    return (
        <div className='text-center'>
            <p className='text-2x1 font-medium text-gray-800'>Đăng ký ngay & nhận ưu đãi 20%</p>
            <p className='text-gray-400 mt-3'>
                Nhận thông tin khuyến mãi và các sản phẩm mới nhất từ cửa hàng của chúng tôi.
            </p>
            <form className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3' onSubmit={onSubmitHandler}>
                <input className="w-full sm:flex-1 outline-none" type="email" placeholder='Nhập email của bạn' />
                <button type='submit' className='bg-black text-white text-xs px-10 py-4'>Đăng ký</button>
            </form>
        </div>
    )
}

export default NewsLetterBox
