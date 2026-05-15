// admin/src/pages/Add.jsx
import React, { useState, useRef } from 'react'
import { assets } from '../assets/assets'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'          // npm install xlsx
import { createProduct, bulkImportProducts } from '../api/products'

const FIELD_CLASS = 'w-full px-4 py-2.5 text-sm rounded-xl outline-none'
const FIELD_STYLE = { border: '1.5px solid #DDD6FE', background: '#FAFAFF', color: '#1E1B4B', borderRadius: '10px' }

const Add = () => {
  const [images, setImages] = useState([null, null, null, null])
  const [name,          setName]          = useState('')
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [category,      setCategory]      = useState('Default')
  const [brand,         setBrand]         = useState('')
  const [note,          setNote]          = useState('')
  const [stock,         setStock]         = useState('10000')
  const [discount,      setDiscount]      = useState('0')
  const [saleStartAt,   setSaleStartAt]   = useState('')
  const [saleEndAt,     setSaleEndAt]     = useState('')
  const [specifications,setSpecifications]= useState([])
  const [loading,       setLoading]       = useState(false)
  const [tab,           setTab]           = useState('manual') // 'manual' | 'excel'
  const excelRef = useRef(null)

  // ── Single product submit ──────────────────────────────────────────────────
  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name',           name)
      formData.append('description',    description)
      formData.append('price',          price)
      formData.append('category',       category)
      formData.append('brand',          brand)
      formData.append('note',           note)
      formData.append('stock',          stock)
      formData.append('discount',       discount)
      if (saleStartAt) formData.append('saleStartAt', saleStartAt)
      if (saleEndAt)   formData.append('saleEndAt',   saleEndAt)
      formData.append('specifications', JSON.stringify(specifications))
      images.forEach((img, i) => img && formData.append(`img${i + 1}`, img))

      const response = await createProduct(formData)
      if (response.data.success) {
        toast.success(response.data.message)
        setName(''); setDescription(''); setCategory('Default'); setPrice('')
        setBrand(''); setNote(''); setStock('10000'); setDiscount('0')
        setSaleStartAt(''); setSaleEndAt(''); setSpecifications([])
        setImages([null, null, null, null])
      } else throw new Error(response.data.message)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Excel import ──────────────────────────────────────────────────────────
  const handleExcelImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb   = XLSX.read(data)
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      if (!rows.length) { toast.warning('File Excel trống hoặc sai định dạng'); return }

      // Map cột Excel → API fields
      const products = rows.map(r => {
        // Parse "Thông số kỹ thuật" dạng "RAM: 8GB; ROM: 256GB"
        const rawSpecs = String(r['Thông số kỹ thuật'] || r.specifications || '');
        const specifications = rawSpecs ? rawSpecs.split(';').map(s => {
          const [key, value] = s.split(':');
          return { key: key?.trim() || '', value: value?.trim() || '' };
        }).filter(s => s.key) : [];

        return {
          name:           String(r['Tên sản phẩm'] || r.name        || '').trim(),
          description:    String(r['Mô tả']         || r.description || '').trim(),
          price:          Number(r['Giá']            || r.price       || 0),
          category:       String(r['Danh mục']       || r.category    || 'Default').trim(),
          brand:          String(r['Thương hiệu']    || r.brand       || '').trim(),
          stock:          Number(r['Tồn kho']        || r.stock       || 10000),
          discount:       Number(r['Giảm giá (%)']   || r.discount    || 0),
          note:           String(r['Ghi chú']        || r.note        || '').trim(),
          images:         r['Ảnh (URL)'] ? [String(r['Ảnh (URL)']).trim()] : undefined,
          specifications: specifications
        };
      })

      setLoading(true)
      const res = await bulkImportProducts(products)
      if (res.data.success) {
        toast.success(res.data.message)
        if (res.data.data.errors?.length) {
          res.data.data.errors.forEach(err => toast.warning(`Bỏ qua "${err.name}": ${err.reason}`))
        }
      } else throw new Error(res.data.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
      if (excelRef.current) excelRef.current.value = ''
    }
  }

  // ── Download sample Excel ─────────────────────────────────────────────────
  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Tên sản phẩm', 'Mô tả', 'Giá', 'Danh mục', 'Thương hiệu', 'Tồn kho', 'Giảm giá (%)', 'Ghi chú', 'Ảnh (URL)', 'Thông số kỹ thuật'],
      ['Sản phẩm mẫu 1', 'Mô tả chi tiết', 500000, 'Điện thoại', 'Samsung', 100, 10, 'Hàng chính hãng', 'https://example.com/img1.jpg', 'RAM: 8GB; Bộ nhớ: 256GB'],
      ['Sản phẩm mẫu 2 (Không có ảnh)', 'Mô tả', 300000, 'Phụ kiện', 'Sony', 50, 0, '', '', 'Màu: Đen; Cổng: USB-C'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm')
    XLSX.writeFile(wb, 'mau-nhap-san-pham.xlsx')
  }

  const LABEL = ({ children }) => (
    <p className='mb-1.5 text-sm font-semibold' style={{ color: '#4F46E5' }}>{children}</p>
  )

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-xl font-bold mb-1' style={{ color: '#1E1B4B' }}>Thêm sản phẩm</h1>
        {/* Tab toggle */}
        <div className='flex gap-2 mt-4'>
          {[['manual','✏️ Nhập thủ công'], ['excel','📊 Nhập từ Excel']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className='px-4 py-2 rounded-xl text-sm font-semibold transition-all'
              style={{ background: tab === key ? '#4F46E5' : '#EEF2FF', color: tab === key ? '#fff' : '#4F46E5' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Excel tab ── */}
      {tab === 'excel' && (
        <div className='rounded-2xl p-6 space-y-4' style={{ background: '#fff', border: '1.5px solid #DDD6FE' }}>
          <div className='flex items-center gap-3 p-4 rounded-xl' style={{ background: '#EEF2FF' }}>
            <span className='text-2xl'>💡</span>
            <div>
              <p className='text-sm font-semibold' style={{ color: '#1E1B4B' }}>Hướng dẫn</p>
              <p className='text-xs mt-0.5' style={{ color: '#6B7280' }}>
                Tải file mẫu, điền thông tin sản phẩm, sau đó upload lại. Ảnh có thể cập nhật sau trong phần chỉnh sửa.
              </p>
            </div>
          </div>

          <button onClick={downloadSample}
            className='px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90'
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            ⬇️ Tải file mẫu Excel
          </button>

          <div>
            <LABEL>Upload file Excel (.xlsx)</LABEL>
            <input ref={excelRef} type='file' accept='.xlsx,.xls'
              onChange={handleExcelImport} disabled={loading}
              className='w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-200 cursor-pointer'
              style={{ color: '#6B7280' }} />
          </div>

          {loading && (
            <div className='flex items-center gap-3 p-4 rounded-xl' style={{ background: '#F5F4FF' }}>
              <div className='w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin' />
              <p className='text-sm font-medium' style={{ color: '#4F46E5' }}>Đang nhập sản phẩm...</p>
            </div>
          )}
        </div>
      )}

      {/* ── Manual tab ── */}
      {tab === 'manual' && (
        <form onSubmit={onSubmitHandler} className='relative'>
          {loading && (
            <div className='absolute inset-0 flex items-center justify-center z-10 rounded-2xl'
              style={{ background: 'rgba(245,244,255,0.85)' }}>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin' />
                <p className='text-sm font-semibold' style={{ color: '#4F46E5' }}>Đang thêm sản phẩm...</p>
              </div>
            </div>
          )}

          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            {/* Images */}
            <div className='rounded-2xl p-5 mb-5' style={{ background: '#fff', border: '1.5px solid #DDD6FE' }}>
              <LABEL>Ảnh sản phẩm</LABEL>
              <div className='flex gap-3 flex-wrap'>
                {images.map((img, i) => (
                  <label key={i} htmlFor={`image${i}`} className='cursor-pointer group'>
                    <div className='w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-indigo-400'
                      style={{ border: '2px dashed #DDD6FE', background: '#F5F4FF' }}>
                      <img className='w-full h-full object-cover' src={img ? URL.createObjectURL(img) : assets.upload_area} alt='' />
                    </div>
                    <input onChange={e => { const a = [...images]; a[i] = e.target.files[0]; setImages(a) }}
                      type='file' id={`image${i}`} hidden />
                  </label>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
              {/* Left column */}
              <div className='rounded-2xl p-5 space-y-4' style={{ background: '#fff', border: '1.5px solid #DDD6FE' }}>
                <div>
                  <LABEL>Tên sản phẩm *</LABEL>
                  <input value={name} onChange={e => setName(e.target.value)} required
                    placeholder='Nhập tên sản phẩm...' className={FIELD_CLASS} style={FIELD_STYLE} />
                </div>
                <div>
                  <LABEL>Mô tả *</LABEL>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
                    placeholder='Mô tả chi tiết...' className={FIELD_CLASS + ' resize-y'} style={FIELD_STYLE} />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <LABEL>Giá (₫)</LABEL>
                    <input type='number' value={price} onChange={e => setPrice(e.target.value)}
                      placeholder='500000' className={FIELD_CLASS} style={FIELD_STYLE} />
                  </div>
                  <div>
                    <LABEL>Tồn kho</LABEL>
                    <input type='number' min={0} value={stock} onChange={e => setStock(e.target.value)}
                      className={FIELD_CLASS} style={FIELD_STYLE} />
                  </div>
                  <div>
                    <LABEL>Danh mục *</LABEL>
                    <input value={category} onChange={e => setCategory(e.target.value)} required
                      placeholder='Điện thoại' className={FIELD_CLASS} style={FIELD_STYLE} />
                  </div>
                  <div>
                    <LABEL>Thương hiệu *</LABEL>
                    <input value={brand} onChange={e => setBrand(e.target.value)} required
                      placeholder='Samsung' className={FIELD_CLASS} style={FIELD_STYLE} />
                  </div>
                </div>
                <div>
                  <LABEL>Ghi chú (tuỳ chọn)</LABEL>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                    placeholder='Bảo hành 12 tháng...' className={FIELD_CLASS + ' resize-y'} style={FIELD_STYLE} />
                </div>
              </div>

              {/* Right column */}
              <div className='space-y-5'>
                {/* Discount */}
                <div className='rounded-2xl p-5' style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A' }}>
                  <div className='flex items-center gap-2 mb-3'>
                    <span className='text-lg'>🔥</span>
                    <p className='text-sm font-bold' style={{ color: '#92400E' }}>Thiết lập Discount</p>
                  </div>
                  <div className='space-y-3'>
                    <div>
                      <label className='text-xs font-semibold mb-1 block' style={{ color: '#92400E' }}>
                        Giảm giá (%) — nhập 0 để tắt
                      </label>
                      <div className='flex items-center gap-2'>
                        <input type='range' min={0} max={90} step={5}
                          value={discount} onChange={e => setDiscount(e.target.value)}
                          className='flex-1 accent-amber-500' />
                        <input type='number' min={0} max={100} value={discount}
                          onChange={e => setDiscount(e.target.value)}
                          className='w-16 px-2 py-1.5 text-center text-sm rounded-lg font-bold'
                          style={{ border: '1.5px solid #FDE68A', background: '#fff', color: '#92400E' }} />
                        <span className='text-sm font-bold' style={{ color: '#92400E' }}>%</span>
                      </div>
                      {Number(discount) > 0 && (
                        <p className='text-xs mt-1' style={{ color: '#B45309' }}>
                          Giá sau giảm: {price
                            ? new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Math.round(Number(price) * (1 - Number(discount)/100)))
                            : '—'
                          }
                        </p>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='text-xs font-semibold mb-1 block' style={{ color: '#92400E' }}>Bắt đầu sale</label>
                        <input type='datetime-local' value={saleStartAt} onChange={e => setSaleStartAt(e.target.value)}
                          className='w-full px-3 py-1.5 text-xs rounded-lg' style={{ border: '1.5px solid #FDE68A', background: '#fff' }} />
                      </div>
                      <div>
                        <label className='text-xs font-semibold mb-1 block' style={{ color: '#92400E' }}>Kết thúc sale</label>
                        <input type='datetime-local' value={saleEndAt} onChange={e => setSaleEndAt(e.target.value)}
                          className='w-full px-3 py-1.5 text-xs rounded-lg' style={{ border: '1.5px solid #FDE68A', background: '#fff' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className='rounded-2xl p-5' style={{ background: '#fff', border: '1.5px solid #DDD6FE' }}>
                  <LABEL>Thông số kỹ thuật</LABEL>
                  {specifications.map((spec, index) => (
                    <div key={index} className='flex gap-2 mb-2'>
                      <input type='text' placeholder='Tên' value={spec.key}
                        onChange={e => { const a = [...specifications]; a[index].key = e.target.value; setSpecifications(a) }}
                        className='flex-1 px-3 py-2 text-sm rounded-lg' style={FIELD_STYLE} />
                      <input type='text' placeholder='Giá trị' value={spec.value}
                        onChange={e => { const a = [...specifications]; a[index].value = e.target.value; setSpecifications(a) }}
                        className='flex-1 px-3 py-2 text-sm rounded-lg' style={FIELD_STYLE} />
                      <button type='button' onClick={() => setSpecifications(specifications.filter((_, i) => i !== index))}
                        className='px-3 py-2 rounded-lg text-white text-xs font-bold'
                        style={{ background: '#EF4444' }}>✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => setSpecifications([...specifications, { key: '', value: '' }])}
                    className='mt-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90'
                    style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    + Thêm thông số
                  </button>
                </div>
              </div>
            </div>

            <button type='submit' disabled={loading}
              className='mt-6 px-8 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-50'
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              {loading ? 'Đang thêm...' : '+ Thêm sản phẩm'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Add