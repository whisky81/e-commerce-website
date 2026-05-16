// components/Address.jsx - Thêm prop readOnly
import { useState } from "react";
const Address = ({ 
    address, 
    onEdit, 
    onDelete, 
    onSetDefault,
    isSelected,
    onSelect,
    readOnly = false // Thêm prop này
}) => {
    const [showFullInfo, setShowFullInfo] = useState(false);

    if (!address) return null;

    const getFullAddress = () => {
        const w = address.wardName ?? address.ward
        const d = address.districtName ?? address.district
        const p = address.provinceName ?? address.province
        const parts = [address.street, w, d, p].filter(Boolean)
        return parts.join(', ')
    };

    return (
        <div className={`
            border rounded-lg p-4 mb-3 transition-all
            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${address.isDefault ? 'bg-gray-50' : ''}
            ${readOnly ? 'cursor-default' : 'hover:border-gray-300'}
        `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">
                        {address.fullName}
                    </h3>
                    {address.isDefault && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Mặc định
                        </span>
                    )}
                </div>
                
                {onSelect && !readOnly && (
                    <input
                        type="radio"
                        name="selectedAddress"
                        checked={isSelected}
                        onChange={() => onSelect(address)}
                        className="w-4 h-4 text-blue-600"
                    />
                )}
            </div>

            {/* Contact Info */}
            <div className="text-gray-600 text-sm mb-2">
                <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 inline text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="font-medium">Điện thoại:</span>
                    {address.phone}
                </p>
                
                <div className="flex items-start gap-2 mt-1">
                    <svg className="w-4 h-4 inline flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="font-medium whitespace-nowrap">Địa chỉ:</span>
                    <p className="text-gray-600">
                        {showFullInfo 
                            ? getFullAddress()
                            : `${address.street}, ${address.wardName ?? address.ward ?? ''}`
                        }
                    </p>
                </div>
            </div>

            {/* View more button */}
            <button
                onClick={() => setShowFullInfo(!showFullInfo)}
                className="text-blue-600 text-sm hover:underline mb-2 cursor-pointer"
            >
                {showFullInfo ? 'Thu gọn' : 'Xem chi tiết'}
            </button>

            {/* Full info */}
            {showFullInfo && (
                <div className="bg-gray-50 p-3 rounded-md text-sm mb-3 space-y-1">
                    <p><span className="font-medium">Tỉnh/Thành phố:</span> {address.provinceName ?? address.province}</p>
                    <p><span className="font-medium">Quận/Huyện:</span> {address.districtName ?? address.district}</p>
                    <p><span className="font-medium">Phường/Xã:</span> {address.wardName ?? address.ward}</p>
                    <p><span className="font-medium">Đường/Thôn:</span> {address.street}</p>
                </div>
            )}

            {/* Actions - chỉ hiện nếu không phải readOnly */}
            {!readOnly && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(address)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                            <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Sửa
                        </button>
                    )}
                    
                    {onDelete && (
                        <button
                            onClick={() => onDelete(address)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Xóa
                        </button>
                    )}
                    
                    {onSetDefault && !address.isDefault && (
                        <button
                            onClick={() => onSetDefault(address)}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                        >
                            <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> Mặc định
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Address;