// frontend/src/pages/VerifyEmail.jsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import useShopContext from "../hooks/useShopContext";
import { useQueryClient } from "@tanstack/react-query";

const VerifyEmail = () => {
  const [searchParams]  = useSearchParams();
  const { backendUrl } = useShopContext();
  const queryClient = useQueryClient();
  const [status,  setStatus]  = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Link không hợp lệ. Vui lòng kiểm tra lại email.");
      return;
    }

    // Prevent double-fire in React StrictMode (dev double-mount).
    // The previous AbortController approach was broken: aborting the first
    // request does NOT stop the backend from consuming the one-use token,
    // so the second request (StrictMode remount) always found the token
    // already consumed and showed "verify thất bại".
    if (firedRef.current) return;
    firedRef.current = true;

    axios
      .get(`${backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message);
          // Refresh user state if the user is already logged in
          try { queryClient.invalidateQueries({ queryKey: ['profile'] }); } catch { /* ignore */ }
        } else {
          setStatus("error");
          setMessage(res.data.message || "Xác nhận thất bại. Vui lòng thử lại.");
        }
      })
      .catch(err => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại."
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">

        {/* Loading */}
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 font-medium">Đang xác nhận email của bạn...</p>
            <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="rounded-2xl p-8 shadow-lg"
            style={{ border: "1.5px solid #D1FAE5", background: "#F0FDF4" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#DCFCE7" }}>
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#065F46" }}>
              Xác nhận thành công!
            </h1>
            <p className="mb-6" style={{ color: "#059669" }}>{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/collection"
                className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}>
                Mua sắm ngay →
              </Link>
              <Link
                to="/"
                className="inline-block px-6 py-3 rounded-xl font-semibold border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all">
                Trang chủ
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="rounded-2xl p-8 shadow-lg"
            style={{ border: "1.5px solid #FEE2E2", background: "#FFF5F5" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#FEE2E2" }}>
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#991B1B" }}>
              Xác nhận thất bại
            </h1>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "#DC2626" }}>
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-yellow-800 text-sm font-medium mb-1">💡 Gợi ý:</p>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>Link xác nhận chỉ có hiệu lực trong <strong>24 giờ</strong></li>
                <li>Mỗi link chỉ dùng được <strong>một lần</strong></li>
                <li>Nếu email đã xác nhận, bạn có thể đăng nhập bình thường</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl text-white font-semibold"
                style={{ background: "#EF4444" }}>
                Đăng nhập
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl font-semibold"
                style={{ background: "#F3F4F6", color: "#374151" }}>
                Về trang chủ
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
