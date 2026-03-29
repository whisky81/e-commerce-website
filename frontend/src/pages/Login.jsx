import React, { useEffect, useState } from 'react'
import useShopContext from '../hooks/useShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [currentState, setCurrentState] = useState('Đăng nhập');
  const { navigate, backendUrl, isAuthenticated, setIsAuthenticated } = useShopContext()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      let response;
      if (currentState === "Đăng ký") {
        response = await axios.post(
          backendUrl + "/api/v2/auth/register",
          {
            name, email, password
          },
          {
            withCredentials: true
          }
        )
      } else {
        response = await axios.post(
          backendUrl + "/api/v2/auth/login",
          {
            email, password
          },
          {
            withCredentials: true
          }
        )
      }
      if (response.data.success) {
        toast.success(response.data.message);
        setIsAuthenticated(true);
        localStorage.setItem("isAuth", true);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated])

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-50'>
      <form 
        onSubmit={onSubmitHandler} 
        className='w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-10'
      >
        <div className='text-center mb-10'>
          <div className='inline-flex items-center gap-3 mb-4'>
            <div className='w-10 h-0.5 bg-slate-900'></div>
            <p className='prata-regular text-4xl font-bold text-slate-900'>{currentState}</p>
            <div className='w-10 h-0.5 bg-slate-900'></div>
          </div>
          <p className='text-slate-600 text-sm'>
            {currentState === 'Đăng nhập' 
              ? 'Đăng nhập vào tài khoản của bạn' 
              : 'Tạo tài khoản mới để mua sắm'}
          </p>
        </div>

        <div className='space-y-4 mb-6'>
          {currentState === 'Đăng nhập' ? null :
            <div>
              <label htmlFor="name" className='block text-sm font-semibold text-slate-700 mb-2'>
                Họ và tên
              </label>
              <input
                id="name"
                onChange={(e) => setName(e.target.value)}
                value={name}
                type="text"
                className='w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400'
                placeholder='Nhập họ và tên'
                required
              />
            </div>
          }

          <div>
            <label htmlFor="email" className='block text-sm font-semibold text-slate-700 mb-2'>
              Email
            </label>
            <input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              className='w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400'
              placeholder='Nhập email của bạn'
              required
            />
          </div>

          <div>
            <label htmlFor="password" className='block text-sm font-semibold text-slate-700 mb-2'>
              Mật khẩu
            </label>
            <input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              className='w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900 placeholder-slate-400'
              placeholder='Nhập mật khẩu'
              required
            />
          </div>
        </div>

        <div className='w-full flex justify-between text-sm mb-6'>
          {currentState === 'Đăng nhập' ? (
            <>
              <button 
                type="button"
                className='text-slate-600 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
              >
                Quên mật khẩu?
              </button>
              <button 
                type="button"
                onClick={() => setCurrentState('Đăng ký')} 
                className='text-blue-600 hover:text-blue-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
              >
                Tạo tài khoản
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={() => setCurrentState('Đăng nhập')} 
              className='ml-auto text-blue-600 hover:text-blue-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'
            >
              Đăng nhập tại đây
            </button>
          )}
        </div>

        <button 
          type='submit' 
          disabled={loading}
          className='w-full bg-slate-900 text-white font-semibold px-8 py-3 mt-4 rounded-lg hover:bg-slate-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transform hover:scale-[1.02] active:scale-[0.98]'
        >
          {loading ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className='animate-spin h-5 w-5' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className='opacity-25' cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className='opacity-75' fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            currentState === 'Đăng nhập' ? 'Đăng nhập' : 'Đăng ký'
          )}
        </button>
      </form>
    </div>
  )
}

export default Login
