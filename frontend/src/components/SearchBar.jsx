import React from 'react'
import useShopContext from '../hooks/useShopContext'
import { assets } from '../assets/assets';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const SearchBar = () => {
    const {
        search, setSearch,
        showSearch, setShowSearch
    } = useShopContext();
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    
    useEffect(() => {
        if (location.pathname.includes('collection')) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [location]);

    if (!showSearch || !visible) return null;

    return (
        <div className='border-b border-slate-200 bg-slate-50 transition-all duration-200'>
            <div className='inline-flex items-center justify-center border-2 border-slate-400 px-6 py-3 my-5 mx-3 rounded-full w-[calc(100%-24px)] sm:w-1/2 bg-white hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all'>
                <input 
                    type="text" 
                    className='flex-1 outline-none bg-transparent text-base text-slate-900 placeholder-slate-500' 
                    placeholder='Tìm kiếm sản phẩm...' 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Tìm kiếm sản phẩm"
                />
                <img className='w-5 h-5 text-slate-600' src={assets.search_icon} alt="" />
            </div>
            <button
                onClick={() => setShowSearch(false)}
                className='inline-block w-4 h-4 mx-3 cursor-pointer hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded'
                aria-label="Đóng tìm kiếm"
            >
                <img src={assets.cross_icon} alt="close" className='w-full h-full' />
            </button>
        </div>
    );
}

export default SearchBar
