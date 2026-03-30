import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Setting = () => {
    const [config, setConfig] = useState(null);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadName, setUploadName] = useState('');
    const load = async () => {
        const response = await axios.get(
            `${backendUrl}/api/v2/setting/config`,
            { withCredentials: true }
        );
        if (response.data.success && response.status >= 200 && response.status < 300) {
            setConfig(response.data.data);
            setBanners(response.data.data.banners || []);
        } else {
            throw new Error(response.data.message || "Failed to load configuration");
        }
    }

    // Load configuration
    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true);
                await load();
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    // Toggle banner active status (only one active at a time)
    const toggleBannerStatus = (index) => {
        const updatedBanners = [...banners];
        if (updatedBanners[index].isActive) return;
        for (let i = 0; i < updatedBanners.length; ++i) {
            updatedBanners[i].isActive = false;
        }
        updatedBanners[index].isActive = true;
        setBanners(updatedBanners);
    };

    // Save updated banners to backend
    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await axios.put(
                `${backendUrl}/api/v2/setting/banners/${banners.findIndex(b => b.isActive)}`,
                {},
                { withCredentials: true }
            );
            if (response.data.success && response.status >= 200 && response.status < 300) {
                toast.success("Cập nhật banner thành công!");
                setConfig({ ...config, banners });
            } else {
                throw new Error(response.data.message || "Failed to update settings");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    // Upload new banner
    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }
        const formData = new FormData();
        formData.append('img', uploadFile);
        if (uploadName.trim()) {
            formData.append('name', uploadName.trim());
        }
        try {
            setUploading(true);
            const response = await axios.post(
                `${backendUrl}/api/v2/setting/banners`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            );
            if (response.data.success) {
                const newBanner = response.data.data;
                setBanners(prev => [...prev, newBanner]);
                toast.success('Thêm banner mới thành công');
                setUploadFile(null);
                setUploadName('');
                const fileInput = document.getElementById('banner-file-input');
                if (fileInput) fileInput.value = '';
            } else {
                throw new Error(response.data.message || 'Upload thất bại');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
                <p className="mt-2 text-gray-600">Quản lý các banner trên trang chủ</p>
            </div>

            {/* Upload new banner section - clearly separated */}
            <div className="mb-12 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-800">Thêm banner mới</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên banner <span className="text-gray-400">(không bắt buộc)</span>
                        </label>
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="VD: Banner mùa hè"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn file ảnh *
                        </label>
                        <input
                            id="banner-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !uploadFile}
                            className={`px-5 py-2 rounded-lg font-medium text-white transition-colors ${uploading || !uploadFile
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tải...
                                </>
                            ) : (
                                'Tải lên'
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">* Hỗ trợ JPG, PNG, GIF. Dung lượng tối đa 5MB.</p>
            </div>

            {/* Existing banners section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-800">Danh sách banner hiện có</h2>
                </div>

                {banners.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow">
                        <p className="text-gray-500 text-lg">Chưa có banner nào. Hãy thêm banner mới ở trên.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {banners.map((banner, index) => (
                                <div
                                    key={banner.id || index}
                                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-transform hover:scale-[1.02]"
                                >
                                    <div className="relative h-48 bg-gray-100">
                                        <img
                                            src={banner.url}
                                            alt={banner.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                                            }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">{banner.name}</h4>
                                        <button
                                            onClick={() => toggleBannerStatus(index)}
                                            disabled={banner.isActive}
                                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${banner.isActive
                                                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                                                }`}
                                        >
                                            {banner.isActive ? (
                                                <>
                                                    <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Đang hoạt động
                                                </>
                                            ) : (
                                                'Đặt làm banner chính'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Save button - clearly separated with border-top and label */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Thay đổi trạng thái active sẽ được lưu khi nhấn nút bên cạnh
                            </span>
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${saving
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Lưu thay đổi'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Setting;