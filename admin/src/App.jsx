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

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₫'
const App = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {isLogin === false ? <Login setIsLogin={setIsLogin} /> : <>
        <NavBar  setIsLogin={setIsLogin}/>
        <hr />
        <div className='flex w-full'>
          <SideBar />
          <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="/add" element={<Add/>} />
              <Route path="/list" element={<List token={isLogin}/>} />
              <Route path="/orders" element={<Orders token={isLogin}/>} />
              <Route path="/products/:productId" element={<Product />}/>
            </Routes>
          </div>
        </div>
      </>}
    </div>
  )
}

export default App
