import { useState, useEffect } from 'react'
import MapPicker from './MapPicker'
import SearchBox from './SearchBox'

const EMPTY_FORM = {
  fullName: '', phone: '',
  street: '', ward: '', province: '',
  isDefault: false,
  lat: null, lng: null, placeId: null,
}

function Field({ label, required, error, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-sm text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function AddressForm({ onSubmit, onCancel, initialData = null }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [mapPos, setMapPos] = useState(null)
  const [errors, setErrors] = useState({})

  // Initialize form if edit mode
  useEffect(() => {
    if (initialData) {
      setForm({ ...EMPTY_FORM, ...initialData })
      if (initialData.lat && initialData.lng) {
        setMapPos([initialData.lat, initialData.lng])
      }
    }
  }, [initialData])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleLocationPicked = (data) => {
    setMapPos(data.position || [data.lat, data.lng])
    setForm(f => ({
      ...f,
      street:   data.street   || f.street,
      ward:     data.ward     || f.ward,
      province: data.province || f.province,
      lat:      data.lat      || (data.position?.[0] ?? null),
      lng:      data.lng      || (data.position?.[1] ?? null),
      placeId:  data.placeId  || null,
    }))
  }

  const handleMapPick = (data) => {
    setMapPos([data.lat, data.lng])
    setForm(f => ({ ...f, ...data }))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên'
    if (!/^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/.test(form.phone)) e.phone = 'Số điện thoại không hợp lệ'
    if (!form.street.trim()) e.street = 'Vui lòng nhập địa chỉ'
    if (!form.ward.trim()) e.ward = 'Vui lòng nhập phường/xã'
    if (!form.province.trim()) e.province = 'Vui lòng nhập tỉnh/thành'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  const inpClass = (key) => `w-full box-border px-3 py-2 text-sm rounded-lg border outline-none ${errors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mt-0 mb-3">
        Click lên bản đồ hoặc tìm kiếm để tự động điền địa chỉ
      </p>

      <div className="relative">
        <SearchBox onSelect={handleLocationPicked} />
        <div className="mt-3 relative z-0">
          <MapPicker position={mapPos} onPick={handleMapPick} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Họ và tên" required error={errors.fullName}>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inpClass('fullName')} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Số điện thoại" required error={errors.phone}>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inpClass('phone')} placeholder="0912345678" />
          </Field>
        </div>

        <Field label="Địa chỉ (số nhà, tên đường)" required error={errors.street}>
          <input value={form.street} onChange={e => set('street', e.target.value)} className={inpClass('street')} placeholder="123 Đường Láng" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Phường/Xã" required error={errors.ward}>
            <input value={form.ward} onChange={e => set('ward', e.target.value)} className={inpClass('ward')} placeholder="Phường Láng Hạ" />
          </Field>
          <Field label="Tỉnh/Thành phố" required error={errors.province}>
            <input value={form.province} onChange={e => set('province', e.target.value)} className={inpClass('province')} placeholder="Hà Nội" />
          </Field>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} className="w-4 h-4 cursor-pointer" />
          <label htmlFor="isDefault" className="text-sm text-gray-600 cursor-pointer select-none">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        <div className="flex gap-2.5 justify-end mt-4">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
              Hủy
            </button>
          )}
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer">
            Lưu địa chỉ
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddressForm
