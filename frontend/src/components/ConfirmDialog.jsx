// frontend/src/components/ConfirmDialog.jsx
import React, { useEffect, useRef } from "react";

/**
 * Reusable confirmation dialog (replaces window.confirm).
 *
 * Props:
 *   show:       boolean
 *   title:      string
 *   message:    string
 *   confirmLabel: string (default: "Xác nhận")
 *   cancelLabel:  string (default: "Hủy")
 *   variant:    "danger" | "default" (default: "default")
 *   onConfirm:  () => void
 *   onCancel:   () => void
 *   loading:    boolean (shows spinner on confirm button)
 */

const ConfirmDialog = ({
  show = false,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (show) {
      cancelRef.current?.focus();
      const handler = (e) => {
        if (e.key === "Escape") onCancel?.();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [show, onCancel]);

  if (!show) return null;

  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      icon: "text-red-500",
    },
    default: {
      button: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
      icon: "text-amber-500",
    },
  };

  const vs = variantStyles[variant] || variantStyles.default;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            variant === "danger" ? "bg-red-100" : "bg-amber-100"
          }`}>
            <svg className={`w-5 h-5 ${vs.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {variant === "danger" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${vs.button}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Đang xử lý...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
