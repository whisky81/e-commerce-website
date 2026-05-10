import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useShopContext from '../hooks/useShopContext';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Favorites = () => {
  const { backendUrl, isAuthenticated } = useShopContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/users/favorites`, { withCredentials: true });
        if (res.data.success) {
          setItems(res.data.data?.favorites || []);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [backendUrl, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='border-t pt-10'>
      <Title text1='Sản phẩm' text2='yêu thích' />
      <p className='text-gray-600 mt-2 mb-8'>Danh sách bạn đã lưu để xem lại sau.</p>

      {loading ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='h-72 bg-gray-100 rounded-xl' />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className='text-gray-500 py-16 text-center'>Chưa có sản phẩm yêu thích nào.</p>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8'>
          {items.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              images={item.images}
              price={item.price}
              salePrice={item.salePrice}
              discount={item.discount}
              soldCount={item.soldCount}
              saleEndAt={item.saleEndAt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;