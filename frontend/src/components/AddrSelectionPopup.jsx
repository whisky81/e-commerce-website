// frontend/src/components/AddrSelectionPopup.jsx
import React from "react";

/**
 * Reusable address-selection popup (3-level address system).
 *
 * Props:
 *   addresses:        Array of user address objects
 *   selectedAddress:  Currently selected address object
 *   onSelect:         (address) => void
 *   onAddNew:         () => void — triggers add-new-address flow
 *   onClose:          () => void
 *   show:             boolean
 */

const AddrSelectionPopup = ({
  addresses = [],
  selectedAddress = null,
  onSelect,
  onAddNew,
  onClose,
  show = false,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <h3 className="font-bold text-lg text-slate-900">
            Chọn địa chỉ giao hàng
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xl cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-5">
          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="text-slate-500 mb-2">Chưa có địa chỉ nào</p>
              <button
                onClick={onAddNew}
                className="text-indigo-600 font-medium text-sm hover:text-indigo-700 cursor-pointer"
              >
                + Thêm địa chỉ mới
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => onSelect(addr)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedAddress?._id === addr._id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{addr.phone}</p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {addr.street}, {addr.wardName || addr.ward}, {addr.districtName || addr.district}, {addr.provinceName || addr.province}
                        </p>
                      </div>
                      {selectedAddress?._id === addr._id && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onAddNew}
                className="mt-4 w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                + Thêm địa chỉ mới
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddrSelectionPopup;
