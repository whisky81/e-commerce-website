import React from 'react'
import { Link } from 'react-router-dom';
import useShopContext from '../hooks/useShopContext';

const ProductItem = ({ id, images, name, price, soldCount, showFavorite = true }) => {
    const { toggleFavorite, favoriteIds } = useShopContext();
    const isFav = favoriteIds.some((fid) => String(fid) === String(id));

    return (
        <div className='relative group text-slate-700 h-full flex flex-col'>
            {showFavorite && (
                <button
                    type='button'
                    aria-label={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(id);
                    }}
                    className='absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover:scale-110'
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill={isFav ? '#e11d48' : 'none'} 
                        stroke={isFav ? '#e11d48' : 'currentColor'} 
                        className='w-5 h-5 transition-colors'
                    >
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                    </svg>
                </button>
            )}
            
            <Link 
                className='cursor-pointer block flex-1 flex flex-col h-full group/card' 
                to={`/product/${id}`}
                aria-label={`Xem chi tiết ${name}`}
            >
                <div className='overflow-hidden rounded-2xl bg-slate-100 mb-4 flex-shrink-0'>
                    <img 
                        className='hover:scale-110 transition-transform duration-300 ease-out w-full aspect-[3/4] object-cover' 
                        src={images[0]} 
                        alt={name}
                        loading="lazy"
                    />
                </div>
                
                <div className='flex flex-col flex-1'>
                    <p className='text-sm md:text-base font-semibold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover/card:text-blue-600 transition-colors'>
                        {name}
                    </p>
                    
                    {soldCount != null && soldCount > 0 && (
                        <p className='text-xs text-slate-500 mb-3 font-medium'>
                            Đã bán {soldCount.toLocaleString('vi-VN')}
                        </p>
                    )}
                    
                    <p className='text-base md:text-lg font-bold text-slate-900 mt-auto'>
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND"
                        }).format(price)}
                    </p>
                </div>
            </Link>
        </div>
    )
}

export default ProductItem
