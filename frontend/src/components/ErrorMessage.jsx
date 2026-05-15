// frontend/src/components/ErrorMessage.jsx
import React from "react";

/**
 * Reusable error + retry state component.
 *
 * Props:
 *   message:  Error message to display
 *   onRetry:  Retry callback (shows retry button if provided)
 *   fullPage: Whether to render as full-page centered
 */

const ErrorMessage = ({ message = "Đã xảy ra lỗi", onRetry, fullPage = false }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullPage ? "py-20" : "py-8"}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-slate-600 text-sm text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Thử lại
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[40vh] flex items-center justify-center">{content}</div>;
  }
  return content;
};

export default ErrorMessage;
