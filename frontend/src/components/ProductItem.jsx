import React from 'react'
import { Link } from 'react-router-dom';

const ProductItem = ({ id, images, name, price }) => {
    return (
        <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
            <div className='overflow-hidden'>
                <img className='hover:scale-110 transition ease-in-out' src={images[0]} alt="" />
            </div>
            <p className='pt-3 pb-1 text-sm'>{name}</p>
            <p className='text-sm font-medium'>{new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
            }).format(price)}</p>
        </Link>
    )
}

export default ProductItem
