import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useShopContext from "../hooks/useShopContext";
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify';
import axios from 'axios';

const Product = () => {
  const { productId } = useParams();
  const { backendUrl, addToCart } = useShopContext();
  const [productData, setProductData] = useState(null)
  const [reviews, setReviews] = useState([]);
  const [image, setImage] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description' hoặc 'reviews'

  const fetchProductData = async () => {
    try {
      const response = await axios.get(
        backendUrl + `/api/v2/products/${productId}`,
        {
          withCredentials: true
        }
      )
      if (response.data.success) {
        setProductData(response.data.data.product);
        setReviews(response.data.data.reviews);
        setImage(response.data.data.product.images[0]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    fetchProductData();
  }, [productId])

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/* product data */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
        {/* image */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {
              productData.images.map((item, index) => (
                <img 
                  onClick={() => setImage(item)} 
                  key={index} 
                  src={item} 
                  alt={productData.name} 
                  className='w-[24%] sm:w-full sm:mb-3 flex-shrik-0 cursor-pointer border-2 hover:border-gray-300 transition-all rounded' 
                />
              ))
            }
          </div>
          <div className='w-full sm:w-[80%]'>
            <img src={image} alt={productData.name} className='w-full h-auto rounded-lg' />
          </div>
        </div>
        
        {/* product information */}
        <div className='flex-1'>
          {/* Thương hiệu và danh mục */}
          <div className='flex items-center gap-3 mb-2'>
            <span className='bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full'>
              {productData.brand}
            </span>
            <span className='bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full'>
              {productData.category}
            </span>
          </div>
          
          <h1 className='font-medium text-3xl mt-2'>{productData.name}</h1>
          
          <div className='flex items-center gap-1 mt-3'>
            {[1, 2, 3, 4, 5].map((star) => (
              <img 
                key={star}
                src={star <= averageRating ? assets.star_icon : assets.star_dull_icon} 
                alt="star" 
                className='w-4' 
              />
            ))}
            <p className='pl-2 text-gray-600'>({reviews.length} đánh giá)</p>
          </div>
          
          <p className='mt-5 text-3xl font-bold'>{productData.price.toLocaleString('vi-VN')} ₫</p>
          
          <button onClick={()=>{addToCart(productData._id, productData.name, productData.images[0], productData.price)}} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 mt-5 hover:bg-gray-800 transition-colors rounded'>
            Thêm vào giỏ hàng
          </button>
          
          <hr className='mt-8 sm:w-4/5' />

          {/* Thông tin thêm */}
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-2'>
            <p className='flex items-center gap-2'>
              <span className='font-medium text-gray-700'>Tình trạng:</span> 
              <span className='text-green-600'>Còn hàng</span>
            </p>
            <p className='flex items-center gap-2'>
              <span className='font-medium text-gray-700'>Vận chuyển:</span> 
              <span>Miễn phí giao hàng toàn quốc</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs: Mô tả & Đánh giá */}
      <div className='mt-20'>
        <div className='flex border-b'>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'description' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'reviews' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đánh giá ({reviews.length})
          </button>
        </div>

        {/* Nội dung tab Mô tả */}
        {activeTab === 'description' && (
          <div className='border-x border-b px-6 py-6 text-sm text-gray-500'>
            {/* Mô tả chi tiết */}
            <div className='mb-6'>
              <h3 className='font-medium text-gray-800 text-base mb-2'>Mô tả chi tiết:</h3>
              <p className='leading-relaxed whitespace-pre-line'>{productData.description}</p>
            </div>
            
            {/* Thông số kỹ thuật */}
            {productData.specifications && productData.specifications.length > 0 && (
              <div className='mb-6'>
                <h3 className='font-medium text-gray-800 text-base mb-2'>Thông số kỹ thuật:</h3>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  {productData.specifications.map((spec, index) => (
                    <div key={index} className='flex py-2 border-b last:border-0'>
                      <span className='font-medium w-1/3 text-gray-700'>{spec.key}:</span>
                      <span className='w-2/3 text-gray-600'>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ghi chú */}
            {productData.note && (
              <div>
                <h3 className='font-medium text-gray-800 text-base mb-2'>Lưu ý:</h3>
                <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg'>
                  <p className='text-yellow-800 text-sm leading-relaxed'>{productData.note}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nội dung tab Đánh giá */}
        {activeTab === 'reviews' && (
          <div className='border-x border-b px-6 py-6'>
            {reviews.length > 0 ? (
              <div className='space-y-6'>
                {/* Tổng quan đánh giá */}
                <div className='flex items-center gap-6 p-4 bg-gray-50 rounded-lg'>
                  <div className='text-center'>
                    <p className='text-4xl font-bold text-gray-800'>{averageRating}</p>
                    <p className='text-sm text-gray-500'>trên 5</p>
                  </div>
                  <div>
                    <div className='flex items-center gap-1 mb-1'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <img 
                          key={star}
                          src={star <= averageRating ? assets.star_icon : assets.star_dull_icon} 
                          alt="" 
                          className='w-4' 
                        />
                      ))}
                    </div>
                    <p className='text-sm text-gray-600'>{reviews.length} đánh giá từ khách hàng</p>
                  </div>
                </div>

                {/* Danh sách đánh giá */}
                {reviews.map((review) => (
                  <div key={review._id} className='border rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='flex items-center'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <img 
                            key={star}
                            src={star <= review.rating ? assets.star_icon : assets.star_dull_icon} 
                            alt="" 
                            className='w-4' 
                          />
                        ))}
                      </div>
                      <p className='font-medium text-gray-800'>{review.user}</p>
                      <p className='text-gray-400 text-xs'>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <p className='text-gray-600'>{review.comment}</p>
                    {review.media && review.media.length > 0 && (
                      <div className='flex gap-2 mt-3'>
                        {review.media.map((item, index) => (
                          <img 
                            key={index} 
                            src={item.url} 
                            alt="review" 
                            className='w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() => window.open(item.url, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-gray-500'>Chưa có đánh giá nào cho sản phẩm này.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* related products */}
      <RelatedProducts category={productData.category} brand={productData.brand}/>
    </div>
  ) : <div className='opacity-0'>Đang tải...</div>
}

export default Product