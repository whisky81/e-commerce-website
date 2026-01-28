import React, { useState, useEffect } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
const BestSeller = () => {
    const { products } = useShopContext();
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        const bestProducts = products.filter((item) => item.bestseller);
        setBestSeller(bestProducts.slice(0, 5));
    }, [products]);
    return (
        <div className='my-10'>
            <div className='text-center text-3x1 py-8'>
                <Title text1="Best" text2="Seller" />
                <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
                    abc abc abc abc abc abc abc abc abc abc abc abc
                </p>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {bestSeller.map((item, index) => (
                    <ProductItem key={index} id={item._id} name={item.name} images={item.image} price={item.price} />
                ))}
            </div>
        </div>
    )
}

export default BestSeller
