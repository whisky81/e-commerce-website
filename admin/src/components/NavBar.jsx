import React, { useState } from 'react'
import { assets } from "../assets/assets"
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from "react-router-dom";

const NavBar = ({ onLogout }) => {
  const navigate = useNavigate();
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)

      await logout()
      onLogout?.()
      toast.success("Đã đăng xuất")
      const redrectUrl = import.meta.env.VITE_FRONTEND_URL;
      if (redrectUrl) window.location.assign(redrectUrl);
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center py-2 px-[4%] justify-between bg-white shadow-sm">
      <Link to="/">
        <img
          className="w-[max(10%,80px)] cursor-pointer"
          src={assets.logo}
          alt="Logo"
        />
      </Link>

      <button
        onClick={handleLogout}
        disabled={loading}
        className={`flex items-center gap-2 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm transition
          ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}
        `}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Đang đăng xuất...
          </>
        ) : (
          "Đăng xuất"
        )}
      </button>
    </div>
  )
}

export default NavBar