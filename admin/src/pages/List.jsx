import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

const List = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)          
  const [deletingId, setDeletingId] = useState(null)   

  const fetchList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        backendUrl + "/api/v2/products/admin",
        { withCredentials: true }
      )

      if (response.data.success) {
        setProducts(response.data.data)
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeProduct = async (id) => {
    try {
      setDeletingId(id)
      const response = await axios.delete(
        backendUrl + `/api/v2/products/${id}`,
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        fetchList()
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  if (loading) {
    return (
      <div className="p-6 text-center text-lg font-semibold animate-pulse">
        Loading products...
      </div>
    )
  }

  return (
    <div>
      <p className='mb-2'>Danh sách sản phẩm</p>

      <div className='flex flex-col gap-2'>
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Ảnh</b>
          <b>Tên Sản Phẩm</b>
          <b>Loại</b>
          <b>Thương Hiệu</b>
          <b>Giá</b>
          <b className='text-center'>Xóa</b>
        </div>

        {products.map((item) => (
          <div
            key={item._id}
            className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm'
          >
            <img className='w-12' src={item.images?.[0]} alt="" />

            <p>
              <Link to={`/products/${item._id}`}>
                {item.name}
              </Link>
            </p>

            <p>{item.category}</p>
            <p>{item.brand}</p>

            <p>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
              }).format(item.price)}
            </p>

            <button
              onClick={() => removeProduct(item._id)}
              disabled={deletingId === item._id}
              className={`text-right md:text-center text-lg
                ${deletingId === item._id 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-red-500 cursor-pointer"}`}
            >
              {deletingId === item._id ? "..." : "X"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default List