import React from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const Users = () => {
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await axios.get(backendUrl + '/api/admin/users', { withCredentials: true })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id }) => {
      const res = await axios.patch(backendUrl + `/api/admin/users/${id}/toggle-active`, {}, { withCredentials: true })
      if (!res.data.success) throw new Error(res.data.message)
      return { id, updatedUser: res.data.data }
    },
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsers'] })
      const previousUsers = queryClient.getQueryData(['adminUsers'])
      queryClient.setQueryData(['adminUsers'], old => 
        old.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u)
      )
      return { previousUsers }
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái')
      if (context?.previousUsers) {
        queryClient.setQueryData(['adminUsers'], context.previousUsers)
      }
    },
    onSuccess: (data) => {
      toast.success(data.updatedUser.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    }
  })

  if (isError) {
    return <div className="p-8 text-center text-red-500">Lỗi: {error.message}</div>
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
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không có người dùng nào.
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
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => toggleMutation.mutate({ id: user._id, currentStatus: user.isActive })}
                          disabled={toggleMutation.isPending && toggleMutation.variables?.id === user._id}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                            toggleMutation.isPending && toggleMutation.variables?.id === user._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            user.isActive 
                              ? 'text-red-600 border-red-200 hover:bg-red-50' 
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {toggleMutation.isPending && toggleMutation.variables?.id === user._id ? '...' : (user.isActive ? 'Khóa' : 'Kích hoạt')}
                        </button>
                      )}
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

export default Users
