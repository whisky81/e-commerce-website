import { useEffect } from "react";
import useShopContext from "../hooks/useShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const User = () => {
    const { user, navigate, isAuthenticated, backendUrl, my } = useShopContext();
    const deleteAddr = async (id) => {
        try {
            const response = await axios.delete(
                backendUrl + `/api/v2/users/addresses/${id}`,
                {
                    withCredentials: true 
                }
            )
            if (!response.data.success) {
                throw new Error(response.data.message);
            }
            toast.success(response.data.message);
            await my();
        } catch (error) {
            toast.error(error.message);
        }
    }
    useEffect(() => {
        if (!isAuthenticated) navigate("/login");
    }, []);
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Đang tải...</div>
            </div>
        );
    }
    
    console.log(user);
    
    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Thông tin tài khoản</h1>
                    <p className="text-gray-600 mt-2">Quản lý thông tin cá nhân và địa chỉ của bạn</p>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="bg-linear-to-r from-gray-600 to-gray-700 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white">Thông tin cá nhân</h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ID tài khoản</p>
                                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="shrink-0">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Họ và tên</p>
                                    <p className="text-gray-900 font-medium">{user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 md:col-span-2">
                                <div className="shrink-0">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-gray-900">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Addresses Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-linear-to-r from-gray-600 to-gray-700 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Địa chỉ của tôi</h2>
                        <span className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {user.addresses.length} địa chỉ
                        </span>
                    </div>
                    
                    <div className="p-6">
                        {user.addresses.length > 0 ? (
                            <div className="space-y-4">
                                {user.addresses.map((addr, index) => (
                                    <div 
                                        key={index} 
                                        className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-600 font-semibold">
                                                        {addr.fullName?.charAt(0) || 'A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{addr.fullName}</p>
                                                    <p className="text-sm text-gray-500">{addr.phone}</p>
                                                </div>
                                            </div>
                                            {addr.isDefault && (
                                                <span className="bg-green-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="ml-13 pl-13">
                                            <div className="flex items-start gap-2 text-gray-600">
                                                <svg className="w-4 h-4 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <p className="text-sm">
                                                    {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                                            <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                                                Sửa
                                            </button>
                                            <button 
                                                onClick={() => deleteAddr(addr._id)}
                                                className="text-sm text-red-600 hover:text-red-700 font-medium">
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-gray-500">Bạn chưa có địa chỉ nào</p>
                                <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                    Thêm địa chỉ mới
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default User;