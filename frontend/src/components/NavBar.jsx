import React from 'react'
import { useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, Link } from 'react-router-dom'
import useShopContext from '../hooks/useShopContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const {
        setShowSearch,
        cartCount,
        navigate,
        setCartItems,
        isAuthenticated,
        setIsAuthenticated,
        backendUrl
    } = useShopContext();

    const logout = async () => {
        try {
            const response = await axios.post(
                backendUrl + "/api/v2/auth/logout",
                {},
                { withCredentials: true }
            )

            if (!response.data.success) {
                throw new Error(response.data.message || "Logout failed")

            }
            toast.success(response.data.message)
            localStorage.removeItem("isAuth");
            setIsAuthenticated(false);
            setCartItems({});
            navigate("/login");
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <div className='flex items-center justify-between py-5 font-medium'>
            <Link to="/"><img src={assets.logo} className="w-36" alt="logo image" /></Link>

            <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
                <NavLink className="flex flex-col items-center gap-1" to="/">
                    <p>Trang chủ</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink className="flex flex-col items-center gap-1" to="/collection">
                    <p>Bộ sưu tập</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink className="flex flex-col items-center gap-1" to="/about">
                    <p>Giới thiệu</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink className="flex flex-col items-center gap-1" to="/contact">
                    <p>Liên hệ</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
            </ul>

            <div className='flex items-center gap-6'>
                <img
                    onClick={() => setShowSearch(true)}
                    src={assets.search_icon}
                    alt="search icon"
                    className='w-5 cursor-pointer'
                />

                <div className='group relative'>
                    <img
                        onClick={() => isAuthenticated ? null : navigate('/login')}
                        src={assets.profile_icon}
                        alt="profile icon"
                        className='w-5 cursor-pointer'
                    />

                    {isAuthenticated && <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4'>
                        <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
                            <p onClick={() => navigate("/user")} className='cursor-pointer hover:text-black'>Hồ sơ</p>
                            <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>Đơn hàng</p>
                            <p onClick={logout} className='cursor-pointer hover:text-black'>Đăng xuất</p>
                        </div>
                    </div>}
                </div>

                <Link to="/cart" className='relative'>
                    <img src={assets.cart_icon} alt="cart icon" className='w-5 min-w-5' />
                    <p className='absolute -right-1.25 -bottom-1.25 w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{cartCount()}</p>
                </Link>

                <img
                    src={assets.menu_icon}
                    alt="menu icon"
                    className='w-5 cursor-pointer sm:hidden'
                    onClick={() => setVisible(true)}
                />
            </div>

            {/* sidebar menu for small screens*/}
            <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
                <div className='flex flex-col text-gray-600'>
                    <div onClick={() => setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
                        <img src={assets.dropdown_icon} alt="dropdown icon" className='h-4 rotate-10' />
                        <p>Quay lại</p>
                    </div>
                    <NavLink onClick={() => setVisible(false)} className="py-2 pl-6 border" to="/">Trang chủ</NavLink>
                    <NavLink onClick={() => setVisible(false)} className="py-2 pl-6 border" to="/collection">Bộ sưu tập</NavLink>
                    <NavLink onClick={() => setVisible(false)} className="py-2 pl-6 border" to="/about">Giới thiệu</NavLink>
                    <NavLink onClick={() => setVisible(false)} className="py-2 pl-6 border" to="/contact">Liên hệ</NavLink>
                </div>
            </div>
        </div>
    )
}

export default NavBar