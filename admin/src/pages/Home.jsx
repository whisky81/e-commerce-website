import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { Link } from 'react-router-dom'

const Home = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        backendUrl + '/api/v2/users/profile',
        { withCredentials: true }
      )
      if (response.data.success) {
        setUserData(response.data.data)
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message || "Không thể tải hồ sơ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="animate-pulse text-gray-500 text-lg">Đang tải…</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-red-500">
        Không có dữ liệu người dùng
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-10">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-bold">
            {userData.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Xin chào, {userData.name}</h1>
            <p className="text-indigo-200 mt-1">{userData.email}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Lối tắt quản trị</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/stats"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <p className="font-medium text-gray-900">Thống kê</p>
            <p className="text-sm text-gray-500 mt-1">Doanh thu, đơn hàng, tồn kho</p>
          </Link>
          <Link
            to="/list"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <p className="font-medium text-gray-900">Sản phẩm</p>
            <p className="text-sm text-gray-500 mt-1">Danh sách & chỉnh sửa</p>
          </Link>
          <Link
            to="/add"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <p className="font-medium text-gray-900">Thêm sản phẩm</p>
            <p className="text-sm text-gray-500 mt-1">Tạo mới kèm tồn kho</p>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin tài khoản</h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-medium text-gray-500">ID</span>
            <span>{userData.id}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-medium text-gray-500">Tên</span>
            <span>{userData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Email</span>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
