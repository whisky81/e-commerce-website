import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import axios from "axios"
import { backendUrl } from "../App"

const Product = () => {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)       
  const [saving, setSaving] = useState(false)        

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          backendUrl + `/api/v2/products/${productId}`,
          { withCredentials: true }
        )
        if (response.data.success) {
          setProduct(response.data.data.product)
          setFormData(response.data.data.product)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specifications]
    newSpecs[index][field] = value
    setFormData(prev => ({ ...prev, specifications: newSpecs }))
  }

  const handleUpdate = async () => {
    try {
      setSaving(true)
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        brand: formData.brand,
        specifications: formData.specifications,
        note: formData.note,
        stock: Number(formData.stock),
      }

      const response = await axios.put(
        backendUrl + `/api/v2/products/${productId}`,
        updateData,
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success("Cập nhật thành công")
        const r2 = await axios.get(
          backendUrl + `/api/v2/products/${productId}`,
          { withCredentials: true }
        )
        if (r2.data.success) {
          setProduct(r2.data.data.product)
          setFormData(r2.data.data.product)
        }
        setIsEdit(false)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(product)
    setIsEdit(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold animate-pulse text-gray-600">
          Đang tải sản phẩm…
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Chi tiết sản phẩm</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="border rounded-xl p-4 flex items-center justify-center bg-gray-50">
            <img
              src={product.images[0]}
              alt={product.name}
              className="max-h-80 object-contain rounded-lg"
            />
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="font-semibold text-gray-600">Tên sản phẩm</label>
              {!isEdit ? (
                <p>{product.name}</p>
              ) : (
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Giá</label>
              {!isEdit ? (
                <p>{product.price.toLocaleString()} ₫</p>
              ) : (
                <input
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Danh mục</label>
              {!isEdit ? (
                <p>{product.category}</p>
              ) : (
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Thương hiệu</label>
              {!isEdit ? (
                <p>{product.brand}</p>
              ) : (
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Tồn kho</label>
              {!isEdit ? (
                <p>{product.stock ?? 0}</p>
              ) : (
                <input
                  name="stock"
                  type="number"
                  min={0}
                  value={formData.stock ?? 0}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Đã bán</label>
              <p className="text-gray-500">{product.soldCount ?? 0} (chỉ tăng khi có đơn)</p>
            </div>

            <div>
              <label className="font-semibold text-gray-600">Mô tả</label>
              {!isEdit ? (
                <p>{product.description}</p>
              ) : (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-gray-600">Ghi chú</label>
              {!isEdit ? (
                <p>{product.note}</p>
              ) : (
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full border rounded-lg p-2"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Thông số kỹ thuật</h3>
          <div className="border rounded-lg overflow-hidden">
            {formData.specifications.map((spec, index) => (
              <div key={index} className="grid grid-cols-2 border-b">
                {!isEdit ? (
                  <>
                    <div className="p-3 bg-gray-50 font-medium">{spec.key}</div>
                    <div className="p-3">{spec.value}</div>
                  </>
                ) : (
                  <>
                    <input
                      value={spec.key}
                      onChange={(e) =>
                        handleSpecChange(index, "key", e.target.value)
                      }
                      className="p-3 border-r"
                    />
                    <input
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecChange(index, "value", e.target.value)
                      }
                      className="p-3"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          {!isEdit ? (
            <button
              onClick={() => setIsEdit(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className={`px-6 py-2 rounded-lg text-white 
                  ${saving ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Product