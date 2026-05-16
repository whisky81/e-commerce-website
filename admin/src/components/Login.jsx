import React, { useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmitHander = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await axios.post(
        backendUrl + "/api/auth/login",
        { email, password },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        login(response.data.data)
      } else {
        throw new Error(response.data.message || "Login failed")
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 w-full">
      <div className="bg-white shadow-lg rounded-xl px-8 py-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>

        <form onSubmit={onSubmitHander} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email Address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              disabled={loading}
              className="rounded-lg w-full px-3 py-2 border border-gray-300 outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              disabled={loading}
              className="rounded-lg w-full px-3 py-2 border border-gray-300 outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full py-2 px-4 rounded-lg text-white transition
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Đang đăng nhập...
              </div>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login