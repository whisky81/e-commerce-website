import React, { useRef, useEffect } from 'react'
import useShopContext from '../hooks/useShopContext'
import { useLocation } from 'react-router-dom'

const SearchBar = () => {
    const { search, setSearch, showSearch, setShowSearch } = useShopContext()
    const location = useLocation()
    const inputRef = useRef(null)
    const visible = location.pathname.includes('collection')

    // Auto-focus input when search bar opens
    useEffect(() => {
        if (showSearch && visible && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showSearch, visible])

    if (!showSearch || !visible) return null

    return (
        <div className='border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 transition-all duration-200'>
            <div className='flex items-center justify-center gap-3 px-4 py-3 max-w-2xl mx-auto'>
                {/* Search input */}
                <div className='flex-1 flex items-center gap-3 bg-white border-2 border-slate-300 rounded-full px-5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all shadow-sm'>
                    {/* Search icon SVG */}
                    <svg className='w-5 h-5 text-slate-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                    <input 
                        ref={inputRef}
                        type='text' 
                        className='flex-1 outline-none bg-transparent text-base text-slate-900 placeholder-slate-400 min-w-0'
                        placeholder='Tìm kiếm sản phẩm...' 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label='Tìm kiếm sản phẩm'
                    />
                    {/* Clear button */}
                    {search && (
                        <button
                            type='button'
                            onClick={() => setSearch('')}
                            className='flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer'
                            aria-label='Xóa tìm kiếm'
                        >
                            <svg className='w-3.5 h-3.5 text-slate-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
                {/* Close search bar */}
                <button
                    type='button'
                    onClick={() => { setShowSearch(false); setSearch('') }}
                    className='flex-shrink-0 w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-sm'
                    aria-label='Đóng tìm kiếm'
                >
                    <svg className='w-4 h-4 text-slate-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default SearchBar
