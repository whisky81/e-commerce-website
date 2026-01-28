import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from "./Title"
import ProductItem from "./ProductItem"
const RelatedProducts = ({ category, subCategory }) => {
    const { products } = useShopContext();
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        if (products.length === 0) return;
        let productsCopy = products.slice();
        productsCopy = productsCopy.filter((item) => category === item.category && subCategory === item.subCategory)
        setRelatedProducts(productsCopy.slice(0, 5));
    }, [products]);

    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1={'Related'} text2={'Products'}/>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {relatedProducts.map((item, index) => (
                    <ProductItem key={index} id={item._id} name={item.name} price={item.price} images={item.image}/>
                ))}
            </div>
        </div>
    )
}

export default RelatedProducts
