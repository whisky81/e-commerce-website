import React from 'react'
import { NavLink } from "react-router-dom"
import { assets } from '../assets/assets'
const SideBar = () => {
    return (
        <div className='w-[18%] min-h-screen border-r'>
            <div className='flex flex-col gap-3 pt-6 pl-[20%] text-base'>
                <NavLink to="/" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l hover:bg-slate-50">
                    <span className="w-5 h-5 text-center font-bold text-indigo-600">◎</span>
                    <p className='hidden md:block'>Tổng quan</p>
                </NavLink>

                <NavLink to="/add" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l">
                    <img className='w-5 h-5' src={assets.add_icon} alt="" />
                    <p className='hidden md:block'>Thêm sản phẩm</p>
                </NavLink>

                <NavLink to="/list" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l">
                    <img className='w-5 h-5' src={assets.order_icon} alt="" />
                    <p className='hidden md:block'>Sản phẩm</p>
                </NavLink>


                <NavLink to="/orders" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l">
                    <img className='w-5 h-5' src={assets.order_icon} alt="" />
                    <p className='hidden md:block'>Đơn hàng</p>
                </NavLink>

                <NavLink to="/stats" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l">
                    <span className="w-5 h-5 text-center text-sm font-bold text-emerald-600">▤</span>
                    <p className='hidden md:block'>Thống kê</p>
                </NavLink>

                <NavLink to="/settings" className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l">
                    <span className="w-5 h-5 text-center text-sm font-bold text-emerald-600">⚙️</span>
                    <p className='hidden md:block'>Cài đặt</p>
                </NavLink>

            </div>
        </div>
    )
}

export default SideBar
