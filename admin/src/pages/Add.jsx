import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios';
import { backendUrl } from '../App';
import { toast, ToastContainer } from 'react-toastify';

const Add = () => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Default");
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault()
      setLoading(true)
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("brand", brand)
      formData.append("note", note)
      formData.append("specifications", JSON.stringify(specifications))

      image1 && formData.append("img1", image1)
      image2 && formData.append("img2", image2)
      image3 && formData.append("img3", image3)
      image4 && formData.append("img4", image4)

      const response = await axios.post(
        backendUrl + "/api/v2/products",
        formData,
        {
          withCredentials: true
        }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setCategory('Default')
        setPrice('')
        setBrand('')
        setNote('')
        setSpecifications([])
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3 relative'>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 min-h-125">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-3"></div>
            <span className="text-gray-700 font-medium">Đang thêm sản phẩm...</span>
          </div>
        </div>
      )}

      <div className={`w-full ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="mb-6">
          <p className='mb-2 font-medium text-gray-700'>Tải ảnh lên</p>
          <div className='flex gap-3'>
            <label htmlFor="image1" className="cursor-pointer">
              <img className='w-24 h-24 object-cover border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
              <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
            </label>

            <label htmlFor="image2" className="cursor-pointer">
              <img className='w-24 h-24 object-cover border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
              <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
            </label>

            <label htmlFor="image3" className="cursor-pointer">
              <img className='w-24 h-24 object-cover border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
              <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
            </label>

            <label htmlFor="image4" className="cursor-pointer">
              <img className='w-24 h-24 object-cover border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
              <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
            </label>
          </div>
        </div>

        <div className="space-y-5 w-full max-w-3xl">

          <div>
            <p className='mb-2 font-medium text-gray-700'>Tên sản phẩm</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base bg-gray-50 hover:bg-white transition-colors'
              type="text"
              placeholder='Nhập tên sản phẩm...'
              required
            />
          </div>

          <div>
            <p className='mb-2 font-medium text-gray-700'>Mô tả sản phẩm</p>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base min-h-32 bg-gray-50 hover:bg-white transition-colors resize-y'
              placeholder='Viết mô tả chi tiết về sản phẩm...'
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='mb-2 font-medium text-gray-700'>Giá sản phẩm</p>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors'
                type="number"
                placeholder='Nhập giá...'
              />
            </div>

            <div>
              <p className='mb-2 font-medium text-gray-700'>Loại sản phẩm</p>
              <input
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors'
                type="text"
                placeholder='Nhập loại sản phẩm...'
                required
              />
            </div>

            <div>
              <p className='mb-2 font-medium text-gray-700'>Thương hiệu</p>
              <input
                onChange={(e) => setBrand(e.target.value)}
                value={brand}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors'
                type="text"
                placeholder='Nhập thương hiệu...'
                required
              />
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">Thông số kỹ thuật</p>
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Color)"
                  value={spec.key}
                  onChange={(e) => {
                    const newSpecs = [...specifications];
                    newSpecs[index].key = e.target.value;
                    setSpecifications(newSpecs);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Red)"
                  value={spec.value}
                  onChange={(e) => {
                    const newSpecs = [...specifications];
                    newSpecs[index].value = e.target.value;
                    setSpecifications(newSpecs);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSpecs = specifications.filter((_, i) => i !== index);
                    setSpecifications(newSpecs);
                  }}
                  className="px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Xóa
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSpecifications([...specifications, { key: "", value: "" }])}
              className="mt-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              + Thêm thông số kỹ thuật
            </button>
          </div>

          <div>
            <p className='mb-2 font-medium text-gray-700'>Lưu ý (tùy chọn)</p>
            <textarea
              onChange={(e) => setNote(e.target.value)}
              value={note}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base min-h-24 bg-gray-50 hover:bg-white transition-colors resize-y'
              placeholder='Nhập các lưu ý đặc biệt về sản phẩm...'
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-36 py-3 mt-6 text-white rounded-lg transition-colors font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
              }`}
          >
            {loading ? 'Đang thêm...' : 'Thêm sản phẩm'}
          </button>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  )
}

export default Add