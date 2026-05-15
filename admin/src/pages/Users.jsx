import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { CheckCircle2, XCircle, Shield, UserPlus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, updateUser, makeAdmin, deleteUser } from '../api/v3/users'

const Users = () => {
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await fetchUsers()
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data || []
    }
  })

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const res = await updateUser(id, { isActive: !isActive })
      if (!res.data.success) throw new Error(res.data.message)
      return { id, updatedUser: res.data.data }
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsers'] })
      const previousUsers = queryClient.getQueryData(['adminUsers'])
      queryClient.setQueryData(['adminUsers'], old =>
        (old || []).map(u => u._id === id ? { ...u, isActive: !isActive } : u)
      )
      return { previousUsers }
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái')
      if (context?.previousUsers) queryClient.setQueryData(['adminUsers'], context.previousUsers)
    },
    onSuccess: (data) => {
      toast.success(data.updatedUser?.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    }
  })

  // Promote to admin
  const promoteMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await makeAdmin(userId)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data
    },
    onSuccess: () => {
      toast.success('Đã thăng cấp lên Admin')
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
    onError: (err) => toast.error(err.message || 'Lỗi khi thăng cấp')
  })

  // Delete user
  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await deleteUser(userId)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data
    },
    onSuccess: () => {
      toast.success('Đã xóa người dùng')
      setConfirmDelete(null)
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
    onError: (err) => toast.error(err.message || 'Lỗi khi xóa người dùng')
  })

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle size={24} className="text-red-500" />
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-300 border-t-indigo-600" />
            Đang tải dữ liệu...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-900 font-semibold">Chưa có người dùng nào</p>
            <p className="text-sm text-slate-500 mt-1">Người dùng mới sẽ xuất hiện tại đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="px-6 py-4">Họ Tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {user.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => toggleMutation.mutate({ id: user._id, isActive: user.isActive })}
                              disabled={toggleMutation.isPending && toggleMutation.variables?.id === user._id}
                              className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                toggleMutation.isPending && toggleMutation.variables?.id === user._id
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                user.isActive
                                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                                  : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                            >
                              {toggleMutation.isPending && toggleMutation.variables?.id === user._id
                                ? '...'
                                : user.isActive ? 'Khóa' : 'Kích hoạt'}
                            </button>
                            <button
                              onClick={() => promoteMutation.mutate(user._id)}
                              disabled={promoteMutation.isPending && promoteMutation.variables === user._id}
                              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title="Thăng cấp Admin"
                            >
                              {promoteMutation.isPending && promoteMutation.variables === user._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-purple-300 border-t-purple-600" />
                              ) : (
                                <Shield size={14} />
                              )}
                              Admin
                            </button>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => setConfirmDelete(user._id)}
                            className="text-sm p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa người dùng"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Xóa người dùng</h3>
                <p className="text-sm text-slate-600 mt-0.5">Hành động này không thể hoàn tác. Bạn có chắc chắn?</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Đang xóa...
                  </>
                ) : 'Xóa người dùng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
