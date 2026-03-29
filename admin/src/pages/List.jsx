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
      <div className="p-6 text-center text-lg font-semibold animate-pulse text-gray-500">
        Đang tải danh sách…
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <p className="mb-4 text-xl font-semibold text-gray-800">Danh sách sản phẩm</p>

      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[72px_minmax(0,2fr)_1fr_1fr_1fr_1fr_1fr_52px] items-center gap-2 py-2 px-3 rounded-t-xl bg-slate-100 text-sm font-semibold text-slate-700">
          <span>Ảnh</span>
          <span>Tên</span>
          <span>Loại</span>
          <span>Thương hiệu</span>
          <span>Giá</span>
          <span>Tồn</span>
          <span>Đã bán</span>
          <span className="text-center">Xóa</span>
        </div>

        {products.map((item) => (
          <div
            key={item._id}
            className="grid grid-cols-2 md:grid-cols-[72px_minmax(0,2fr)_1fr_1fr_1fr_1fr_1fr_52px] gap-2 py-3 px-3 border border-gray-100 rounded-xl bg-white shadow-sm items-center text-sm text-gray-700"
          >
            <img className="w-14 h-14 object-cover rounded-lg hidden md:block" src={item.images?.[0]} alt="" />
            <p className="md:col-auto col-span-2 font-medium">
              <Link className="hover:text-blue-600" to={`/products/${item._id}`}>
                {item.name}
              </Link>
            </p>
            <p className="hidden md:block">{item.category}</p>
            <p className="hidden md:block">{item.brand}</p>
            <p className="hidden md:block">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
              }).format(item.price)}
            </p>
            <p className="hidden md:block">{item.stock ?? "—"}</p>
            <p className="hidden md:block">{item.soldCount ?? 0}</p>
            <button
              type="button"
              onClick={() => removeProduct(item._id)}
              disabled={deletingId === item._id}
              className={`text-center md:text-right text-lg justify-self-end
                ${deletingId === item._id
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-500 cursor-pointer hover:text-red-700"}`}
            >
              {deletingId === item._id ? "…" : "✕"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default List
