import React from 'react'

const Title = ({ text1, text2 }) => {
  return (
    <div className='inline-flex items-center gap-4 mb-4'>
        <div className='text-gray-500 text-lg md:text-xl'>
            {text1} <span className='text-gray-700 font-semibold'>{text2}</span>
        </div>
        <div className='w-10 h-0.5 bg-gray-700 sm:w-16 sm:h-1 md:w-20'></div>
    </div>
  )
}

export default Title