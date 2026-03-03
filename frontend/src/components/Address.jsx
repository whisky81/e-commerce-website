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

    const getFullAddress = () => {
        const parts = [
            address.street,
            address.ward,
            address.district,
            address.province
        ].filter(Boolean);
        return parts.join(', ');
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
                    <span className="font-medium">📞 Điện thoại:</span>
                    {address.phone}
                </p>
                
                <div className="flex items-start gap-2 mt-1">
                    <span className="font-medium whitespace-nowrap">📍 Địa chỉ:</span>
                    <p className="text-gray-600">
                        {showFullInfo 
                            ? getFullAddress()
                            : `${address.street}, ${address.ward}`
                        }
                    </p>
                </div>
            </div>

            {/* View more button */}
            <button
                onClick={() => setShowFullInfo(!showFullInfo)}
                className="text-blue-600 text-sm hover:underline mb-2"
            >
                {showFullInfo ? 'Thu gọn' : 'Xem chi tiết'}
            </button>

            {/* Full info */}
            {showFullInfo && (
                <div className="bg-gray-50 p-3 rounded-md text-sm mb-3 space-y-1">
                    <p><span className="font-medium">Tỉnh/Thành phố:</span> {address.province}</p>
                    <p><span className="font-medium">Quận/Huyện:</span> {address.district}</p>
                    <p><span className="font-medium">Phường/Xã:</span> {address.ward}</p>
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
                            ✏️ Sửa
                        </button>
                    )}
                    
                    {onDelete && (
                        <button
                            onClick={() => onDelete(address)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            🗑️ Xóa
                        </button>
                    )}
                    
                    {onSetDefault && !address.isDefault && (
                        <button
                            onClick={() => onSetDefault(address)}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                        >
                            ⭐ Đặt làm mặc định
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Address;