// frontend/src/pages/User.jsx
import { useEffect, useState } from "react";
import useShopContext from "../hooks/useShopContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import AddressForm from "../components/AddressForm";

const User = () => {
  const { user, navigate, isAuthenticated, backendUrl } = useShopContext();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const openAddAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const saveAddress = async (formData) => {
    try {
      if (editingAddress) {
        const response = await axios.put(
          `${backendUrl}/api/users/addresses/${editingAddress._id}`,
          formData,
          { withCredentials: true }
        );
        if (!response.data.success) throw new Error(response.data.message);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        const response = await axios.post(
          `${backendUrl}/api/users/addresses`,
          formData,
          { withCredentials: true }
        );
        if (!response.data.success) throw new Error(response.data.message);
        toast.success("Thêm địa chỉ thành công");
      }
      closeAddressModal();
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Có lỗi xảy ra");
    }
  };

  // ─── Upload avatar ─────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await axios.post(`${backendUrl}/api/users/avatar`, form, { withCredentials: true });
      if (res.data.success) {
        toast.success("Cập nhật ảnh đại diện thành công");
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else throw new Error(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Upload thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteAddr = async (id) => {
    try {
      const response = await axios.delete(
        backendUrl + `/api/users/addresses`,
        { data: { bulk: [id] }, withCredentials: true }
      );
      if (!response.data.success) throw new Error(response.data.message);
      toast.success(response.data.message);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-lg">Đang tải...</div>
      </div>
    );
  }

  const avatarUrl = user.avatar?.url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff&size=160&bold=true`;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thông tin tài khoản</h1>
          <p className="text-gray-500 mt-1">Quản lý thông tin cá nhân và địa chỉ của bạn</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Thông tin cá nhân</h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
              {/* ✅ Avatar với upload */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 shadow-md">
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-md"
                  title="Đổi ảnh đại diện"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={handleAvatarUpload} disabled={uploading}
                  />
                </label>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    ✅ Email đã xác nhận
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Email chưa xác nhận
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">ID tài khoản</p>
                  <p className="font-mono text-xs text-gray-700 mt-0.5 break-all">{user.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-gray-700 mt-0.5">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Địa chỉ của tôi</h2>
            <div className="flex items-center gap-3">
              <span className="bg-white text-indigo-700 px-3 py-0.5 rounded-full text-sm font-semibold">
                {user.addresses.length} địa chỉ
              </span>
              <button onClick={openAddAddress} className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-indigo-500 transition shadow-sm border border-indigo-400">
                + Thêm mới
              </button>
            </div>
          </div>

          <div className="p-6">
            {user.addresses.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((addr, index) => (
                  <div key={addr._id || index}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                          {addr.fullName?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                        </div>
                      </div>
                      {addr.isDefault && (
                        <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-gray-600 ml-13 pl-1">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm">
                        {addr.street}, {addr.ward}, {addr.province}
                      </p>
                    </div>

                    {addr.lat && addr.lng && (
                      <a href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-2 ml-5 text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">
                        📍 Xem trên Google Maps
                      </a>
                    )}

                    <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openEditAddress(addr)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Sửa
                      </button>
                      <button
                        onClick={() => deleteAddr(addr._id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                        <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-400">Chưa có địa chỉ nào</p>
                <p className="text-sm text-gray-400 mt-1">Thêm địa chỉ khi đặt hàng</p>
              </div>
            )}
          </div>
        </div>
        {/* Modal Thêm/Sửa địa chỉ */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden mt-10 mb-10 relative">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                <button onClick={closeAddressModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <AddressForm 
                  initialData={editingAddress}
                  onSubmit={saveAddress}
                  onCancel={closeAddressModal}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default User;