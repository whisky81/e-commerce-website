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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    // console.log(name, email, password)
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
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated])

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {currentState === 'Đăng nhập' ? '' :
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className='w-full px-3 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800'
          placeholder='Họ và tên'
          required
        />
      }

      <input
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        type="email"
        className='w-full px-3 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800'
        placeholder='Email'
        required
      />

      <input
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
        className='w-full px-3 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800'
        placeholder='Mật khẩu'
        required
      />

      <div className='w-full flex justify-between text-sm -mt-2'>
        <p className='cursor-pointer hover:text-gray-600 transition-colors'>Quên mật khẩu?</p>
        {
          currentState === 'Đăng nhập' ?
            <p onClick={() => setCurrentState('Đăng ký')} className='cursor-pointer hover:text-gray-600 transition-colors'>
              Tạo tài khoản
            </p> :
            <p onClick={() => setCurrentState('Đăng nhập')} className='cursor-pointer hover:text-gray-600 transition-colors'>
              Đăng nhập tại đây
            </p>
        }
      </div>

      <button className='bg-black text-white font-light px-8 py-2 mt-4 hover:bg-gray-800 transition-colors'>
        {currentState === 'Đăng nhập' ? 'Đăng nhập' : 'Đăng ký'}
      </button>
    </form>
  )
}

export default Login