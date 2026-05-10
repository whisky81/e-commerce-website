import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { Eye, EyeOff, Trash2, MessageSquare, Star } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const Reviews = () => {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState([])

  const { data: reviews = [], isLoading, isError, error } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: async () => {
      const res = await axios.get(backendUrl + '/api/admin/reviews', { withCredentials: true })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id }) => {
      const res = await axios.put(backendUrl + `/api/admin/reviews/${id}/toggle-hidden`, {}, { withCredentials: true })
      if (!res.data.success) throw new Error(res.data.message)
      return { id, updatedReview: res.data.data }
    },
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['adminReviews'] })
      const previousReviews = queryClient.getQueryData(['adminReviews'])
      queryClient.setQueryData(['adminReviews'], old => 
        old.map(r => r._id === id ? { ...r, isHidden: !currentStatus } : r)
      )
      return { previousReviews }
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái')
      if (context?.previousReviews) {
        queryClient.setQueryData(['adminReviews'], context.previousReviews)
      }
    },
    onSuccess: (data) => {
      toast.success(data.updatedReview.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị lại đánh giá')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await axios.delete(backendUrl + '/api/admin/reviews', {
        data: { bulk: ids },
        withCredentials: true
      })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Xóa thành công')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi xóa đánh giá')
    }
  })

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map(r => r._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} đánh giá đã chọn?`)) return
    bulkDeleteMutation.mutate(selectedIds)
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Lỗi: {error.message}</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý đánh giá</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm duyệt bình luận và đánh giá sản phẩm</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={18} />
            {bulkDeleteMutation.isPending ? 'Đang xóa...' : `Xóa ${selectedIds.length} mục`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <MessageSquare size={48} className="text-slate-300 mb-4" />
            <p>Chưa có đánh giá nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.length === reviews.length && reviews.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Đánh giá</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map(review => (
                  <tr key={review._id} className={`hover:bg-slate-50/80 transition-colors ${review.isHidden ? 'bg-slate-50 opacity-70' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(review._id)}
                        onChange={() => handleSelect(review._id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate" title={review.product?.name}>
                      {review.product?.name || 'Sản phẩm đã xóa'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{review.user?.name || 'Khách ẩn danh'}</div>
                      <div className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-orange-500">
                        {review.rating} <Star size={14} className="fill-orange-500 ml-1" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-sm">
                      <p className="line-clamp-2" title={review.comment}>{review.comment}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        review.isHidden ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleMutation.mutate({ id: review._id, currentStatus: review.isHidden })}
                        disabled={toggleMutation.isPending && toggleMutation.variables?.id === review._id}
                        className={`text-sm font-medium p-2 rounded-lg transition-colors ${
                          toggleMutation.isPending && toggleMutation.variables?.id === review._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200'
                        } ${review.isHidden ? 'text-blue-600' : 'text-slate-600'}`}
                        title={review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                      >
                        {toggleMutation.isPending && toggleMutation.variables?.id === review._id ? '...' : (review.isHidden ? <Eye size={18} /> : <EyeOff size={18} />)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews
