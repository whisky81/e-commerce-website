// admin/src/components/SideBar.jsx
import React from 'react'
import { NavLink } from "react-router-dom"

const navItems = [
  { to: "/",          label: "Tổng quan",       icon: "🏠" },
  { to: "/add",       label: "Thêm sản phẩm",   icon: "➕" },
  { to: "/list",      label: "Sản phẩm",        icon: "📦" },
  { to: "/orders",    label: "Đơn hàng",        icon: "🧾" },
  { to: "/stats",     label: "Thống kê",        icon: "📊" },
  { to: "/marketing", label: "Tiếp thị",        icon: "📣" },  // ✅ NEW
  { to: "/settings",  label: "Cài đặt",         icon: "⚙️" },
]

const SideBar = () => (
  <div className='w-16 md:w-56 min-h-screen flex-shrink-0 pt-6 pb-6 px-2 md:px-3'
    style={{ background: '#1A1740', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
    <nav className='flex flex-col gap-1'>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-indigo-300 hover:text-white hover:bg-white/10'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 text-base ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className='hidden md:block text-sm font-medium'>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  </div>
)

export default SideBar
