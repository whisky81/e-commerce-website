import { useState, useEffect } from 'react'
import MapPicker from './MapPicker'
import SearchBox from './SearchBox'
import { fetchProvinces, fetchDistricts, fetchWards } from '../api/addresses'

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  street: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
  lat: null,
  lng: null,
  placeId: null,
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

/** @typedef {{ fullName:string, phone:string, street:string, ward:string, district:string, province:string, wardCode:string, districtId:number, provinceId:number, isDefault?:boolean, lat?:number|null, lng?:number|null, placeId?:string|null }} AddressPayload */

/**
 * Cascade chọn GHN — địa chỉ có status === false không thể chọn (api_v3_docs).
 */
function AddressForm({ onSubmit, onCancel, initialData = null }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [mapPos, setMapPos] = useState(null)
  const [errors, setErrors] = useState({})

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [provinceId, setProvinceId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [wardCode, setWardCode] = useState('')

  const [lastDropdownChange, setLastDropdownChange] = useState(0)

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM)
      setProvinceId('')
      setDistrictId('')
      setWardCode('')
      setDistricts([])
      setWards([])
      setMapPos(null)
      return
    }
    setForm({
      ...EMPTY_FORM,
      ...initialData,
      fullName: initialData.fullName ?? '',
      phone: initialData.phone ?? '',
      street: initialData.street ?? '',
      ward: initialData.ward ?? '',
      district: initialData.district ?? '',
      province: initialData.province ?? '',
      isDefault: Boolean(initialData.isDefault),
      lat: initialData.lat ?? null,
      lng: initialData.lng ?? null,
      placeId: initialData.placeId ?? null,
    })
    if (initialData.lat && initialData.lng) {
      setMapPos([initialData.lat, initialData.lng])
    }
    if (initialData.provinceId != null && initialData.provinceId !== '') {
      setProvinceId(Number(initialData.provinceId))
    }
    if (initialData.districtId != null && initialData.districtId !== '') {
      setDistrictId(Number(initialData.districtId))
    }
    if (initialData.wardCode != null && initialData.wardCode !== '') {
      setWardCode(String(initialData.wardCode))
    }
  }, [initialData])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingProvinces(true)
      try {
        const res = await fetchProvinces()
        if (!cancelled && res.data.success) {
          setProvinces(res.data.data ?? [])
        }
      } catch {
        if (!cancelled) setProvinces([])
      } finally {
        if (!cancelled) setLoadingProvinces(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (provinceId === '' || provinceId == null) {
      setDistricts([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingDistricts(true)
      try {
        const res = await fetchDistricts(provinceId)
        if (!cancelled && res.data.success) {
          setDistricts(res.data.data ?? [])
        }
      } catch {
        if (!cancelled) setDistricts([])
      } finally {
        if (!cancelled) setLoadingDistricts(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [provinceId])

  useEffect(() => {
    if (districtId === '' || districtId == null) {
      setWards([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingWards(true)
      try {
        const res = await fetchWards(districtId)
        if (!cancelled && res.data.success) {
          setWards(res.data.data ?? [])
        }
      } catch {
        if (!cancelled) setWards([])
      } finally {
        if (!cancelled) setLoadingWards(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [districtId])

  // Map synchronization when dropdowns change
  useEffect(() => {
    if (!lastDropdownChange || !provinceId) return

    const p = provinces.find((x) => x.id === Number(provinceId))?.name
    if (!p) return
    const d = districts.find((x) => x.id === Number(districtId))?.name
    const w = wards.find((x) => String(x.id) === String(wardCode))?.name

    const parts = [w, d, p, 'Việt Nam'].filter(Boolean)
    const query = parts.join(', ')

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        const data = await res.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          setMapPos([lat, lon])
          setForm(f => ({ ...f, lat, lng: lon, placeId: data[0].place_id?.toString() }))
        }
      } catch (err) {
        console.error("Geocoding failed:", err)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [lastDropdownChange, provinceId, districtId, wardCode, provinces, districts, wards])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleLocationPicked = (data) => {
    setMapPos(data.position || [data.lat, data.lng])
    setForm((f) => ({
      ...f,
      street: data.street || f.street,
      ward: data.ward || f.ward,
      province: data.province || f.province,
      lat: data.lat || (data.position?.[0] ?? null),
      lng: data.lng || (data.position?.[1] ?? null),
      placeId: data.placeId || null,
    }))
  }

  const handleMapPick = (data) => {
    setMapPos([data.lat, data.lng])
    setForm((f) => ({ ...f, ...data }))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên'
    if (!/^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      e.phone = 'Số điện thoại không hợp lệ'
    }
    if (!form.street.trim()) e.street = 'Vui lòng nhập địa chỉ'
    if (provinceId === '' || provinceId == null) e.provinceId = 'Chọn Tỉnh/Thành phố GHN'
    if (districtId === '' || districtId == null) e.districtId = 'Chọn Quận/Huyện GHN'
    if (!wardCode) e.wardCode = 'Chọn Phường/Xã GHN'
    const p = provinces.find((x) => x.id === Number(provinceId))
    const d = districts.find((x) => x.id === Number(districtId))
    const w = wards.find((x) => String(x.id) === String(wardCode))
    if (p?.status === false) e.provinceId = 'Tỉnh không hỗ trợ giao hàng'
    if (d?.status === false) e.districtId = 'Quận/Huyện không hỗ trợ giao hàng'
    if (w?.status === false) e.wardCode = 'Phường/Xã không hỗ trợ giao hàng'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const p = provinces.find((x) => x.id === Number(provinceId))
    const d = districts.find((x) => x.id === Number(districtId))
    const w = wards.find((x) => String(x.id) === String(wardCode))
    /** @type {AddressPayload} */
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      province: p?.name ?? form.province.trim(),
      district: d?.name ?? form.district.trim(),
      ward: w?.name ?? form.ward.trim(),
      wardCode: String(w?.id ?? wardCode),
      districtId: Number(districtId),
      provinceId: Number(provinceId),
      isDefault: form.isDefault,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
      placeId: form.placeId ?? null,
    }
    onSubmit(payload)
  }

  const inpClass = (key) =>
    `w-full box-border px-3 py-2 text-sm rounded-lg border outline-none ${errors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`

  const selClass = (key) =>
    `w-full box-border px-3 py-2 text-sm rounded-lg border outline-none bg-white ${errors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mt-0 mb-3">
        Chọn Tỉnh → Quận/Huyện → Phường/Xã theo dữ liệu GHN. Các khu vực bị ghạch không giao được sẽ bị khóa chọn.
      </p>
      <p className="text-sm text-gray-500 mb-3">
        Có thể dùng bản đồ / tìm kiếm để điền đường — vẫn cần chọn đầy đủ 3 cấp GHN.
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
            <input
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className={inpClass('fullName')}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Số điện thoại" required error={errors.phone}>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inpClass('phone')}
              placeholder="0912345678"
            />
          </Field>
        </div>

        <Field label="Địa chỉ (số nhà, tên đường)" required error={errors.street}>
          <input
            value={form.street}
            onChange={(e) => set('street', e.target.value)}
            className={inpClass('street')}
            placeholder="123 Đường Láng"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-x-4">
          <Field label="Tỉnh/Thành phố (GHN)" required error={errors.provinceId}>
            <select
              value={provinceId === '' ? '' : String(provinceId)}
              onChange={(e) => {
                const v = e.target.value
                setProvinceId(v === '' ? '' : Number(v))
                setDistrictId('')
                setWardCode('')
                setWards([])
                setLastDropdownChange(Date.now())
              }}
              disabled={loadingProvinces}
              className={selClass('provinceId')}
            >
              <option value="">{loadingProvinces ? 'Đang tải…' : '— Chọn —'}</option>
              {provinces.map((pr) => (
                <option key={pr.id} value={pr.id} disabled={pr.status === false}>
                  {pr.name}
                  {pr.status === false ? ' (không giao)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quận/Huyện (GHN)" required error={errors.districtId}>
            <select
              value={districtId === '' ? '' : String(districtId)}
              onChange={(e) => {
                const v = e.target.value
                setDistrictId(v === '' ? '' : Number(v))
                setWardCode('')
                setLastDropdownChange(Date.now())
              }}
              disabled={!provinceId || loadingDistricts}
              className={selClass('districtId')}
            >
              <option value="">{loadingDistricts ? 'Đang tải…' : '— Chọn —'}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id} disabled={d.status === false}>
                  {d.name}
                  {d.status === false ? ' (không giao)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phường/Xã (GHN)" required error={errors.wardCode}>
            <select
              value={wardCode}
              onChange={(e) => {
                setWardCode(e.target.value)
                setLastDropdownChange(Date.now())
              }}
              disabled={!districtId || loadingWards}
              className={selClass('wardCode')}
            >
              <option value="">{loadingWards ? 'Đang tải…' : '— Chọn —'}</option>
              {wards.map((w) => (
                <option key={w.id} value={String(w.id)} disabled={w.status === false}>
                  {w.name}
                  {w.status === false ? ' (không giao)' : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) => set('isDefault', e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="isDefault" className="text-sm text-gray-600 cursor-pointer select-none">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        <div className="flex gap-2.5 justify-end mt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
          >
            Lưu địa chỉ
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddressForm
