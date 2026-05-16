import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { fetchConfig, addBanner, activateBannerByIndex } from '../api/settings';
import { ImagePlus, Images, CheckCircle2, Save, UploadCloud } from 'lucide-react';

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
        const response = await fetchConfig();
        if (response.data.success && response.status >= 200 && response.status < 300) {
            setConfig(response.data.data);
            setBanners(response.data.data.banners || []);
        } else {
            throw new Error(response.data.message || "Failed to load configuration");
        }
    }

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

    const toggleBannerStatus = (index) => {
        const updatedBanners = [...banners];
        if (updatedBanners[index].isActive) return;
        for (let i = 0; i < updatedBanners.length; ++i) {
            updatedBanners[i].isActive = false;
        }
        updatedBanners[index].isActive = true;
        setBanners(updatedBanners);
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const activeIndex = banners.findIndex(b => b.isActive);
            if (activeIndex === -1) { toast.error("Vui lòng chọn một banner"); setSaving(false); return; }
            const response = await activateBannerByIndex(activeIndex);
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
            const response = await addBanner(formData);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Cài đặt giao diện</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý banner hiển thị trên trang chủ ứng dụng</p>
            </div>

            {/* Upload new banner section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <ImagePlus className="text-blue-600" size={20} />
                    <h2 className="text-lg font-bold text-slate-900">Thêm banner mới</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Tên banner <span className="text-slate-400 font-normal">(tùy chọn)</span>
                        </label>
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="VD: Khuyến mãi Hè"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            File ảnh *
                        </label>
                        <div className="relative">
                            <input
                                id="banner-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-slate-50 rounded-lg border border-slate-200 border-dashed"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !uploadFile}
                            className={`w-full md:w-auto px-5 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                                uploading || !uploadFile
                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Đang tải...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={18} />
                                    <span>Tải lên</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">* Hỗ trợ JPG, PNG. Khuyến nghị tỷ lệ 16:9, dung lượng {"<"} 5MB.</p>
            </div>

            {/* Existing banners section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <Images className="text-blue-600" size={20} />
                    <h2 className="text-lg font-bold text-slate-900">Danh sách banner</h2>
                </div>

                {banners.length === 0 ? (
                    <div className="text-center py-12">
                        <Images size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Chưa có banner nào. Hãy tải lên banner đầu tiên.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {banners.map((banner, index) => (
                                <div
                                    key={banner.id || index}
                                    className={`bg-white rounded-xl overflow-hidden border-2 transition-all ${
                                        banner.isActive ? 'border-green-500 shadow-md ring-2 ring-green-100' : 'border-slate-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="relative aspect-video bg-slate-100">
                                        <img
                                            src={banner.url}
                                            alt={banner.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x200?text=Lỗi+hiển+thị';
                                            }}
                                        />
                                        {banner.isActive && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-slate-50">
                                        <h4 className="font-semibold text-slate-800 mb-3 truncate" title={banner.name}>
                                            {banner.name || 'Banner không tên'}
                                        </h4>
                                        <button
                                            onClick={() => toggleBannerStatus(index)}
                                            disabled={banner.isActive}
                                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                                                banner.isActive
                                                    ? 'bg-green-100 text-green-700 cursor-default'
                                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                                            }`}
                                        >
                                            {banner.isActive ? 'Banner đang chọn' : 'Chọn làm banner chính'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Save Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                Nhớ bấm "Lưu thay đổi" để áp dụng banner mới lên trang chủ
                            </span>
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${
                                    saving
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-orange-500 hover:bg-orange-600 shadow-sm hover:shadow-md'
                                }`}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Lưu thay đổi</span>
                                    </>
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