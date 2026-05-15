import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Trash2, MessageSquare, Star } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReviews, hideReview, unhideReview, bulkDeleteReviews } from '../api/v3/reviews'

const Reviews = () => {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const { data: reviews = [], isLoading, isError, error } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: async () => {
      const res = await fetchReviews()
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data || []
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isHidden }) => {
      const res = isHidden ? await unhideReview(id) : await hideReview(id)
      if (!res.data.success) throw new Error(res.data.message)
      return { id, updatedReview: res.data.data }
    },
    onMutate: async ({ id, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: ['adminReviews'] })
      const previousReviews = queryClient.getQueryData(['adminReviews'])
      queryClient.setQueryData(['adminReviews'], old =>
        (old || []).map(r => r._id === id ? { ...r, isHidden: !isHidden } : r)
      )
      return { previousReviews }
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái')
      if (context?.previousReviews) queryClient.setQueryData(['adminReviews'], context.previousReviews)
    },
    onSuccess: (data) => {
      toast.success(data.updatedReview?.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị lại đánh giá')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await bulkDeleteReviews(ids)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Xóa thành công')
      setSelectedIds([])
      setConfirmBulkDelete(false)
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi xóa đánh giá')
    }
  })

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(reviews.map(r => r._id))
    else setSelectedIds([])
  }

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmBulkDelete(true)
  }

  const confirmBulkDeleteAction = () => {
    bulkDeleteMutation.mutate(selectedIds)
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <MessageSquare size={24} className="text-red-500" />
        </div>
        <p className="text-red-600 font-medium">Lỗi tải dữ liệu</p>
        <p className="text-sm text-slate-500 mt-1">{error?.message}</p>
      </div>
    )
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
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Trash2 size={18} />
            Xóa {selectedIds.length} mục
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-300 border-t-indigo-600" />
            Đang tải dữ liệu...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-900 font-semibold">Chưa có đánh giá nào</p>
            <p className="text-sm text-slate-500 mt-1">Đánh giá của khách hàng sẽ xuất hiện tại đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                        onClick={() => toggleMutation.mutate({ id: review._id, isHidden: review.isHidden })}
                        disabled={toggleMutation.isPending && toggleMutation.variables?.id === review._id}
                        className={`text-sm font-medium p-2 rounded-lg transition-colors ${
                          toggleMutation.isPending && toggleMutation.variables?.id === review._id
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-slate-200'
                        } ${review.isHidden ? 'text-blue-600' : 'text-slate-600'}`}
                        title={review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                      >
                        {toggleMutation.isPending && toggleMutation.variables?.id === review._id
                          ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600" />
                          : review.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk delete confirmation modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Xóa đánh giá</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  Bạn có chắc chắn muốn xóa {selectedIds.length} đánh giá đã chọn? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmBulkDeleteAction}
                disabled={bulkDeleteMutation.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Đang xóa...
                  </>
                ) : `Xóa ${selectedIds.length} đánh giá`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews
