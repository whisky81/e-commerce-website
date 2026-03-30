// frontend/src/pages/Collection.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import useShopContext from '../hooks/useShopContext'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 12

const Collection = () => {
  const { search, showSearch, backendUrl } = useShopContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [showFilter, setShowFilter]   = useState(false)
  const [category,   setCategory]     = useState([])
  const [brands,     setBrands]       = useState([])
  const [sortType,   setSortType]     = useState('relavent')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  const [items,         setItems]         = useState([])
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [] })
  const [loading,       setLoading]       = useState(true)
  const [totalPages,    setTotalPages]    = useState(1)
  const [total,         setTotal]         = useState(0)

  // ─── Pagination: read from URL ──────────────────────────────────────────────
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const setPage = useCallback((n) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (n <= 1) next.delete('page')
      else next.set('page', String(n))
      return next
    }, { replace: true })
  }, [setSearchParams])

  // ─── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ─── FIX: reset page when filters change (use ref to avoid infinite loop) ──
  const prevKey = useRef('')
  const filterKey = [category.join(','), brands.join(','), sortType, debouncedSearch, String(showSearch)].join('|')

  useEffect(() => {
    if (prevKey.current === '') { prevKey.current = filterKey; return }
    if (prevKey.current !== filterKey) {
      prevKey.current = filterKey
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // ─── Fetch products ─────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      try {
        const sortParam = sortType === 'low-high' ? 'price' : sortType === 'high-low' ? '-price' : undefined
        const params = { page, limit: PAGE_SIZE }
        if (category.length) params.categories = category.join(',')
        if (brands.length)   params.brands     = brands.join(',')
        if (sortParam)       params.sort       = sortParam
        if (showSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim()

        const { data: res } = await axios.get(`${backendUrl}/api/v2/products`, {
          params, signal: controller.signal, withCredentials: true,
        })
        if (res.success) {
          setItems(res.data || [])
          setTotalPages(res.totalPages || 1)
          setTotal(res.total ?? 0)
          if (res.filters) setFilterOptions(res.filters)
        }
      } catch (e) {
        if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [backendUrl, page, category, brands, sortType, debouncedSearch, showSearch])

  const toggleCategory = (v) => setCategory(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  const toggleBrands   = (v) => setBrands  (prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const cats = filterOptions.categories?.length ? filterOptions.categories : []
  const brs  = filterOptions.brands?.length      ? filterOptions.brands    : []

  // ─── Pagination buttons list ────────────────────────────────────────────────
  const pageNumbers = (() => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
      else if (pages[pages.length - 1] !== '…') pages.push('…')
    }
    return pages
  })()

  return (
    <div className='flex flex-col sm:flex-row gap-6 pt-8 pb-16'>

      {/* ── Sidebar filter ── */}
      <div className='w-full sm:w-56 flex-shrink-0'>
        <button onClick={() => setShowFilter(!showFilter)}
          className='sm:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold mb-4'
          style={{ background: '#fff', border: '1.5px solid #EDE9FE', color: '#1E1B4B' }}>
          <span>🔍 Bộ lọc {(category.length + brands.length) > 0 && `(${category.length + brands.length})`}</span>
          <span>{showFilter ? '▲' : '▼'}</span>
        </button>

        <div className={`${showFilter ? 'block' : 'hidden'} sm:block space-y-3`}>
          {(category.length > 0 || brands.length > 0) && (
            <button onClick={() => { setCategory([]); setBrands([]) }}
              className='w-full py-2 rounded-xl text-xs font-semibold text-red-500'
              style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
              ✕ Xóa tất cả bộ lọc
            </button>
          )}

          {/* Category filter */}
          <div className='rounded-2xl p-4' style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
            <p className='text-sm font-semibold mb-3' style={{ color: '#1E1B4B' }}>Danh mục</p>
            <div className='space-y-2'>
              {cats.map(c => (
                <label key={c} className='flex items-center gap-2 cursor-pointer group'>
                  <div onClick={() => toggleCategory(c)}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      category.includes(c) ? 'bg-indigo-600' : 'border-2 border-slate-300 group-hover:border-indigo-400'
                    }`}>
                    {category.includes(c) && <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>}
                  </div>
                  <span className={`text-sm ${category.includes(c) ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand filter */}
          <div className='rounded-2xl p-4' style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
            <p className='text-sm font-semibold mb-3' style={{ color: '#1E1B4B' }}>Thương hiệu</p>
            <div className='space-y-2'>
              {brs.map(b => (
                <label key={b} className='flex items-center gap-2 cursor-pointer group'>
                  <div onClick={() => toggleBrands(b)}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      brands.includes(b) ? 'bg-indigo-600' : 'border-2 border-slate-300 group-hover:border-indigo-400'
                    }`}>
                    {brands.includes(b) && <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>}
                  </div>
                  <span className={`text-sm ${brands.includes(b) ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}>{b}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
          <div>
            <Title text1="Tất cả" text2="bộ sưu tập" />
            <p className='text-sm mt-0.5' style={{ color: '#9CA3AF' }}>
              {loading ? 'Đang tải…' : `${total.toLocaleString('vi-VN')} sản phẩm`}
            </p>
          </div>
          <select value={sortType} onChange={e => setSortType(e.target.value)}
            className='text-sm px-3 py-2 rounded-xl font-medium cursor-pointer'
            style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', background: '#fff' }}>
            <option value="relavent">Mới nhất</option>
            <option value="low-high">Giá: thấp → cao</option>
            <option value="high-low">Giá: cao → thấp</option>
          </select>
        </div>

        {loading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='rounded-2xl animate-pulse' style={{ background: '#EDE9FE', aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-lg font-medium' style={{ color: '#1E1B4B' }}>Không tìm thấy sản phẩm</p>
            <p className='text-sm mt-1' style={{ color: '#9CA3AF' }}>Thử thay đổi bộ lọc hoặc từ khóa</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {items.map(item => (
              <ProductItem
                key={item._id}
                id={item._id}
                name={item.name}
                images={item.images}
                price={item.price}
                salePrice={item.salePrice}
                discount={item.discount}
                soldCount={item.soldCount}
              />
            ))}
          </div>
        )}

        {/* ── Fixed Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 mt-10 flex-wrap'>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className='px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40'
              style={{ background: page <= 1 ? '#F5F4FF' : '#4F46E5', color: page <= 1 ? '#9CA3AF' : '#fff', border: '1.5px solid #EDE9FE' }}>
              ← Trước
            </button>

            {pageNumbers.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className='w-9 h-9 flex items-center justify-center text-sm' style={{ color: '#9CA3AF' }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className='w-9 h-9 rounded-xl text-sm font-medium transition-all'
                  style={{ background: page === p ? '#4F46E5' : '#fff', color: page === p ? '#fff' : '#1E1B4B', border: `1.5px solid ${page === p ? '#4F46E5' : '#EDE9FE'}` }}>
                  {p}
                </button>
              )
            )}

            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className='px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40'
              style={{ background: page >= totalPages ? '#F5F4FF' : '#4F46E5', color: page >= totalPages ? '#9CA3AF' : '#fff', border: '1.5px solid #EDE9FE' }}>
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Collection
