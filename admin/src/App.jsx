import React, { useEffect } from 'react'
import NavBar from "./components/NavBar"
import SideBar from "./components/SideBar"
import { Routes, Route } from "react-router-dom"
import Add from "./pages/Add"
import List from "./pages/List"
import Orders from "./pages/Orders"
import { useState } from "react"
import Login from "./components/Login"
import { ToastContainer } from 'react-toastify';
import Home from './pages/Home'
import Product from './pages/Product'
import Stats from './pages/Stats'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₫'
const App = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className='bg-gradient-to-br from-slate-100 via-white to-slate-50 min-h-screen'>
      <ToastContainer />
      {isLogin === false ? <Login setIsLogin={setIsLogin} /> : <>
        <NavBar  setIsLogin={setIsLogin}/>
        <div className='flex w-full max-w-[1600px] mx-auto'>
          <SideBar />
          <div className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-10 text-gray-700 text-base">
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="/add" element={<Add/>} />
              <Route path="/list" element={<List token={isLogin}/>} />
              <Route path="/orders" element={<Orders token={isLogin}/>} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/products/:productId" element={<Product />}/>
            </Routes>
          </div>
        </div>
      </>}
    </div>
  )
}

export default App
