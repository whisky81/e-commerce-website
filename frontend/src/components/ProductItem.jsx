import React from 'react'
import { Link } from 'react-router-dom';
import useShopContext from '../hooks/useShopContext';

const ProductItem = ({ id, images, name, price, soldCount, showFavorite = true }) => {
    const { toggleFavorite, favoriteIds } = useShopContext();
    const isFav = favoriteIds.some((fid) => String(fid) === String(id));

    return (
        <div className='relative group text-gray-700'>
            {showFavorite && (
                <button
                    type='button'
                    aria-label={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(id);
                    }}
                    className='absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors'
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFav ? '#e11d48' : 'none'} stroke={isFav ? '#e11d48' : 'currentColor'} className='w-5 h-5'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                    </svg>
                </button>
            )}
            <Link className='cursor-pointer block' to={`/product/${id}`}>
                <div className='overflow-hidden rounded-xl bg-gray-50'>
                    <img className='hover:scale-105 transition ease-in-out w-full aspect-[3/4] object-cover' src={images[0]} alt="" />
                </div>
                <p className='pt-3 pb-1 text-base font-medium line-clamp-2'>{name}</p>
                {soldCount != null && soldCount > 0 && (
                    <p className='text-xs text-gray-500 mb-1'>Đã bán {soldCount.toLocaleString('vi-VN')}</p>
                )}
                <p className='text-base font-semibold text-gray-900'>{new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                }).format(price)}</p>
            </Link>
        </div>
    )
}

export default ProductItem
