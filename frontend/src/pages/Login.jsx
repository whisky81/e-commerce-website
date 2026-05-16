// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import useShopContext from "../hooks/useShopContext";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [currentState, setCurrentState] = useState("Đăng nhập");
  const { navigate, backendUrl } = useShopContext();
  const { login, register, isLoggingIn, isRegistering, isAuthenticated } = useAuth();
  
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [email,    setEmail]    = useState("");
  
  // OAuth redirect is handled in App.jsx now

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (currentState === "Đăng ký") {
      register({ name, email, password });
    } else {
      login({ email, password });
    }
  };

  const loading = isLoggingIn || isRegistering;

  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${backendUrl}/api/auth/facebook`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-0.5 bg-slate-900" />
            <p className="prata-regular text-3xl font-bold text-slate-900">{currentState}</p>
            <div className="w-10 h-0.5 bg-slate-900" />
          </div>
          <p className="text-slate-500 text-sm">
            {currentState === "Đăng nhập"
              ? "Đăng nhập vào tài khoản của bạn"
              : "Tạo tài khoản mới để mua sắm"}
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-4 mb-5">
          {currentState !== "Đăng nhập" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                type="text" placeholder="Nhập họ và tên" required
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="Nhập email của bạn" required
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
            <input
              value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="Nhập mật khẩu" required
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex justify-between text-sm mb-5">
          {currentState === "Đăng nhập" ? (
            <>
              <button type="button" className="text-slate-500 hover:text-slate-700 transition-colors">
                Quên mật khẩu?
              </button>
              <button type="button" onClick={() => setCurrentState("Đăng ký")}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Tạo tài khoản
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setCurrentState("Đăng nhập")}
              className="ml-auto text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Đăng nhập tại đây
            </button>
          )}
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-slate-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            currentState === "Đăng nhập" ? "Đăng nhập" : "Đăng ký"
          )}
        </button>

        {/* ✅ OAuth divider */}
        <div className="mt-6">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="mx-4 text-xs text-slate-400 whitespace-nowrap">hoặc đăng nhập bằng</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <div className="mt-4 space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700 text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Tiếp tục với Google
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center gap-3 py-3 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all font-medium text-blue-700 text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Tiếp tục với Facebook
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;