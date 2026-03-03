import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse text-gray-500">Đang tải hồ sơ...</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Không có dữ liệu người dùng
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
            {userData.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-3 text-xl font-semibold">Hồ sơ người dùng</h2>
        </div>
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between border-b pb-1">
            <span className="font-medium">ID</span>
            <span>{userData.id}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="font-medium">Tên</span>
            <span>{userData.name}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="font-medium">Email</span>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home