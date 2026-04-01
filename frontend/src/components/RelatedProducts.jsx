import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from "./Title"
import ProductItem from "./ProductItem"

const RelatedProducts = ({ category, brand }) => {
    const { products } = useShopContext();
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        if (products.length === 0) return;
        const filtered = products
            .filter(item => item.category === category && item.brand === brand)
            .slice(0, 5);
        setRelatedProducts(filtered);
    }, [products, category, brand]);

    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1={'Sản Phẩm'} text2={'Tương Tự'} />
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {relatedProducts.map(item => (
                    <ProductItem
                        key={item._id}
                        id={item._id}
                        name={item.name}
                        price={item.price}
                        salePrice={item.salePrice}
                        discount={item.discount}
                        images={item.images}
                        soldCount={item.soldCount}
                    />
                ))}
            </div>
        </div>
    )
}

export default RelatedProducts
