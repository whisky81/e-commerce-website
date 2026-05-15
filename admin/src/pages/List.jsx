import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, bulkDeleteProducts } from '../api/products'
import { TableSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Trash2, PackageSearch, Search } from 'lucide-react'

const LIMIT = 20

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(n)

const List = () => {
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // 'single' id or 'bulk'
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", { page, limit: LIMIT }],
    queryFn: () => fetchProducts({ page, limit: LIMIT }),
    staleTime: 30_000,
  })

  const products = data?.data?.data ?? []
  const meta = data?.data?.meta ?? {}
  const totalPages = meta.totalPages ?? 1
  const hasPrev = meta.hasPrev ?? false
  const hasNext = meta.hasNext ?? false

  const deleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteProducts(ids),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Xóa thành công')
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setSelectedIds([])
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleDelete = (id) => {
    setConfirmDelete(id)
  }

  const confirmDeleteAction = async () => {
    const id = confirmDelete
    setConfirmDelete(null)
    if (!id) return
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync([id])
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p._id))
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
    setConfirmDelete('bulk')
  }

  const confirmBulkDeleteAction = async () => {
    setConfirmDelete(null)
    setBulkDeleting(true)
    try {
      await deleteMutation.mutateAsync(selectedIds)
    } finally {
      setBulkDeleting(false)
    }
  }

  if (isLoading) {
    return <TableSkeleton rows={8} cols={7} />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center"><svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Lỗi tải dữ liệu</h3>
        <p className="text-sm text-gray-500 mb-4">{error?.message || "Không thể tải danh sách sản phẩm"}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý sản phẩm, tồn kho và giá bán</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={18} />
              {bulkDeleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} mục`}
            </button>
          )}
          <Link to="/add" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {products.length === 0 ? (
          <EmptyState icon="package" title="Chưa có sản phẩm nào"
            description="Thêm sản phẩm đầu tiên để bắt đầu bán hàng."
            action={<Link to="/add" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">+ Thêm sản phẩm</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 w-20">Ảnh</th>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4 hidden md:table-cell">Loại</th>
                  <th className="px-6 py-4 hidden md:table-cell">Thương hiệu</th>
                  <th className="px-6 py-4 text-right">Giá</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Tồn kho</th>
                  <th className="px-6 py-4 text-center hidden lg:table-cell">Đã bán</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => handleSelect(item._id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img className="w-12 h-12 object-cover rounded-lg border border-slate-200" src={item.images?.[0]?.url || 'https://via.placeholder.com/48'} alt="" />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-[200px] truncate" title={item.name}>
                      <Link className="hover:text-blue-600 transition-colors" to={`/products/${item._id}`}>
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{item.category}</td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{item.brand}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">{fmt(item.price)}</td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.stock ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 hidden lg:table-cell">{item.soldCount ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className={`p-2 rounded-lg transition-colors ${
                          deletingId === item._id
                            ? "opacity-50 cursor-not-allowed text-slate-400"
                            : "text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer opacity-0 group-hover:opacity-100"
                        }`}
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!hasPrev}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasPrev
                ? "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            let pageNum
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasNext}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasNext
                ? "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Xóa sản phẩm</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {confirmDelete === 'bulk'
                    ? `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`
                    : 'Bạn có chắc chắn muốn xóa sản phẩm này?'}
                  {' '}Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId || bulkDeleting}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete === 'bulk' ? confirmBulkDeleteAction : confirmDeleteAction}
                disabled={deletingId || bulkDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(deletingId || bulkDeleting) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Đang xóa...
                  </>
                ) : confirmDelete === 'bulk' ? `Xóa ${selectedIds.length} sản phẩm` : 'Xóa sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}

export default List
