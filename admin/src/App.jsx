// admin/src/App.jsx
import React from 'react'
import NavBar from "./components/NavBar"
import SideBar from "./components/SideBar"
import { Routes, Route, Navigate } from "react-router-dom"
import Add from "./pages/Add"
import List from "./pages/List"
import Orders from "./pages/Orders"
import Login from "./components/Login"
import { ToastContainer } from 'react-toastify'
import Home from './pages/Home'
import Product from './pages/Product'
import Stats from './pages/Stats'
import Setting from './pages/Setting'
import Marketing from './pages/Marketing'
import Users from './pages/Users'
import Reviews from './pages/Reviews'
import { useAuth } from './context/AuthContext'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₫'

const App = () => {
  const { isInitialized, isAuthenticated, user } = useAuth()

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-[var(--color-bg)]'>
        <ToastContainer position="top-right" autoClose={3000}
          toastStyle={{ borderRadius: '12px', fontFamily: 'var(--font-sans)', fontSize: '14px' }} />
        <Login />
      </div>
    )
  }

  // If authenticated but not admin, show unauthorized access
  if (user?.role !== 'admin') {
    return (
      <div className='min-h-screen bg-[var(--color-bg)] flex items-center justify-center'>
        <ToastContainer position="top-right" autoClose={3000}
          toastStyle={{ borderRadius: '12px', fontFamily: 'var(--font-sans)', fontSize: '14px' }} />
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
          <p className="text-slate-600 mb-4">Bạn không có quyền truy cập vào trang quản trị.</p>
          <NavBar />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[var(--color-bg)]'>
      <ToastContainer position="top-right" autoClose={3000}
        toastStyle={{ borderRadius: '12px', fontFamily: 'var(--font-sans)', fontSize: '14px' }} />
      <NavBar />
      <div className='flex w-full max-w-400 mx-auto'>
        <SideBar />
        <div className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-8">
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/add"        element={<Add />} />
            <Route path="/list"       element={<List token={true} />} />
            <Route path="/orders"     element={<Orders token={true} />} />
            <Route path="/users"      element={<Users />} />
            <Route path="/reviews"    element={<Reviews />} />
            <Route path="/stats"      element={<Stats />} />
            <Route path="/marketing"  element={<Marketing />} />
            <Route path="/settings"   element={<Setting />} />
            <Route path="/products/:productId" element={<Product />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App