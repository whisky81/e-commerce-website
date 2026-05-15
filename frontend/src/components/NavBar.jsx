import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, Link } from 'react-router-dom'
import useShopContext from '../hooks/useShopContext'
const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const {
        setShowSearch,
        cartCount,
        navigate,
        isAuthenticated,
        favoriteIds,
        logout
    } = useShopContext();

    const handleLogout = () => {
        logout();
    }

    return (
        <div className='bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg'>
            <div className='flex items-center justify-between py-4 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
                {/* Logo */}
                <Link to="/">
                    <img src={assets.logo} className="w-32 sm:w-40 brightness-110" alt="logo image" />
                </Link>

                {/* Desktop Menu */}
                <ul className='hidden sm:flex gap-8 text-sm lg:text-base'>
                    <NavLink className="flex flex-col items-center gap-1 group" to="/">
                        <p className='group-hover:text-blue-400 transition-colors'>Trang chủ</p>
                        <hr className='w-2/4 border-none h-[1.5px] bg-blue-400 hidden group-[.active]:block' />
                    </NavLink>
                    <NavLink className="flex flex-col items-center gap-1 group" to="/collection">
                        <p className='group-hover:text-blue-400 transition-colors'>Bộ sưu tập</p>
                        <hr className='w-2/4 border-none h-[1.5px] bg-blue-400 hidden group-[.active]:block' />
                    </NavLink>
                    <NavLink className="flex flex-col items-center gap-1 group" to="/about">
                        <p className='group-hover:text-blue-400 transition-colors'>Giới thiệu</p>
                        <hr className='w-2/4 border-none h-[1.5px] bg-blue-400 hidden group-[.active]:block' />
                    </NavLink>
                    <NavLink className="flex flex-col items-center gap-1 group" to="/contact">
                        <p className='group-hover:text-blue-400 transition-colors'>Liên hệ</p>
                        <hr className='w-2/4 border-none h-[1.5px] bg-blue-400 hidden group-[.active]:block' />
                    </NavLink>
                </ul>

                {/* Right Icons */}
                <div className='flex items-center gap-6'>
                    <button
                        onClick={() => setShowSearch(true)}
                        className='hover:text-blue-400 transition-colors active:scale-90'
                        aria-label="Tìm kiếm"
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </button>

                    {/* Profile Menu */}
                    <div className='group relative'>
                        <button
                            onClick={() => isAuthenticated ? navigate('/user') : navigate('/login')}
                            className='hover:text-blue-400 transition-colors active:scale-90'
                            aria-label="Hồ sơ"
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                            </svg>
                        </button>

                        {isAuthenticated && (
                            <div className='group-hover:block hidden absolute right-0 pt-4 z-20'>
                                <div className='flex flex-col gap-2 w-40 py-3 px-5 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg shadow-xl'>
                                    <p 
                                        onClick={() => navigate("/user")} 
                                        className='cursor-pointer hover:text-blue-400 transition-colors py-1'
                                    >
                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Hồ sơ
                                    </p>
                                    <p 
                                        onClick={() => navigate('/favorites')} 
                                        className='cursor-pointer hover:text-blue-400 transition-colors py-1'
                                    >
                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> Yêu thích
                                    </p>
                                    <p 
                                        onClick={() => navigate('/orders')} 
                                        className='cursor-pointer hover:text-blue-400 transition-colors py-1'
                                    >
                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> Đơn hàng
                                    </p>
                                    <hr className='border-slate-600 my-1' />
                                    <p 
                                        onClick={handleLogout} 
                                        className='cursor-pointer hover:text-red-400 transition-colors py-1 text-red-300'
                                    >
                                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Đăng xuất
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wishlist Icon with Badge */}
                    {isAuthenticated && (
                        <Link 
                            to="/favorites" 
                            className='relative group hidden sm:block'
                            title="Yêu thích"
                        >
                            <svg className='w-5 h-5 group-hover:text-red-400 transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                            </svg>
                            {favoriteIds.length > 0 && (
                                <span className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold'>
                                    {favoriteIds.length}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Cart Icon with Badge */}
                    <Link to="/cart" className='relative group'>
                        <svg className='w-5 h-5 group-hover:text-blue-400 transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10-9l2 9m-9 0h18m-18 0a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z' />
                        </svg>
                        <span className='absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold'>
                            {cartCount}
                        </span>
                    </Link>

                    {/* Mobile Menu Icon */}
                    <button
                        onClick={() => setVisible(true)}
                        className='sm:hidden hover:text-blue-400 transition-colors active:scale-90'
                        aria-label="Menu"
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed top-0 right-0 bottom-0 overflow-hidden bg-slate-900 transition-all ${visible ? 'w-full' : 'w-0'} sm:hidden z-40`}>
                <div className='flex flex-col h-full'>
                    <div 
                        onClick={() => setVisible(false)} 
                        className='flex items-center gap-4 p-4 cursor-pointer border-b border-slate-700'
                    >
                        <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                        <p className='text-white'>Đóng</p>
                    </div>
                    <nav className='flex flex-col text-gray-300 flex-1'>
                        <NavLink 
                            onClick={() => setVisible(false)} 
                            className="py-3 px-6 border-b border-slate-700 hover:bg-slate-800 hover:text-blue-400 transition-colors" 
                            to="/"
                        >
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-6 0h6" /></svg> Trang chủ
                        </NavLink>
                        <NavLink 
                            onClick={() => setVisible(false)} 
                            className="py-3 px-6 border-b border-slate-700 hover:bg-slate-800 hover:text-blue-400 transition-colors" 
                            to="/collection"
                        >
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> Bộ sưu tập
                        </NavLink>
                        <NavLink 
                            onClick={() => setVisible(false)} 
                            className="py-3 px-6 border-b border-slate-700 hover:bg-slate-800 hover:text-blue-400 transition-colors" 
                            to="/about"
                        >
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Giới thiệu
                        </NavLink>
                        <NavLink 
                            onClick={() => setVisible(false)} 
                            className="py-3 px-6 border-b border-slate-700 hover:bg-slate-800 hover:text-blue-400 transition-colors" 
                            to="/contact"
                        >
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> Liên hệ
                        </NavLink>
                        {isAuthenticated && (
                            <NavLink 
                                onClick={() => setVisible(false)} 
                                className="py-3 px-6 border-b border-slate-700 hover:bg-slate-800 hover:text-blue-400 transition-colors" 
                                to="/favorites"
                            >
                                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> Yêu thích
                            </NavLink>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    )
}

export default NavBar