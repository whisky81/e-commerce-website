// admin/src/components/SideBar.jsx
import React from 'react'
import { NavLink } from "react-router-dom"
import { LayoutDashboard, PlusCircle, Package, ReceiptText, BarChart3, Megaphone, Settings, Users, Star } from 'lucide-react'

const navItems = [
  { to: "/",          label: "Tổng quan",       icon: <LayoutDashboard size={20} /> },
  { to: "/add",       label: "Thêm sản phẩm",   icon: <PlusCircle size={20} /> },
  { to: "/list",      label: "Sản phẩm",        icon: <Package size={20} /> },
  { to: "/orders",    label: "Đơn hàng",        icon: <ReceiptText size={20} /> },
  { to: "/users",     label: "Người dùng",      icon: <Users size={20} /> },
  { to: "/reviews",   label: "Đánh giá",        icon: <Star size={20} /> },
  { to: "/stats",     label: "Thống kê",        icon: <BarChart3 size={20} /> },
  { to: "/marketing", label: "Tiếp thị",        icon: <Megaphone size={20} /> },
  { to: "/settings",  label: "Cài đặt",         icon: <Settings size={20} /> },
]

const SideBar = () => (
  <div className='w-16 md:w-56 min-h-screen flex-shrink-0 pt-6 pb-6 px-2 md:px-3 bg-white border-r border-slate-200'>
    <nav className='flex flex-col gap-1'>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
              isActive
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </span>
              <span className='hidden md:block text-sm'>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  </div>
)

export default SideBar
