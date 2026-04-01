import React, { useState, useEffect } from 'react'
import useShopContext from "../hooks/useShopContext"
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {
  const { products } = useShopContext();
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    setLatestProducts(products.slice(0, 10));
  }, [products]);

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'BỘ SƯU TẬP'} text2={'MỚI NHẤT'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
          Trải nghiệm loạt sản phẩm điện tử thế hệ mới với kiểu dáng sang trọng,
          cấu hình vượt trội và nhiều tính năng thông minh.
          Sự lựa chọn hoàn hảo cho cuộc sống số hiện đại.
        </p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {latestProducts.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            images={item.images}
            name={item.name}
            price={item.price}
            salePrice={item.salePrice}
            discount={item.discount}
            soldCount={item.soldCount}
          />
        ))}
      </div>
    </div>
  )
}

export default LatestCollection
