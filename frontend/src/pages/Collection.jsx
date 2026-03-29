import React, { useState, useEffect, useCallback, useRef } from 'react'
import useShopContext from '../hooks/useShopContext'
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 12;

const Collection = () => {
  const { search, showSearch, backendUrl } = useShopContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showFilter, setShowFilter] = useState(false)
  const [category, setCategory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sortType, setSortType] = useState('relavent');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [items, setItems] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setPage = useCallback((n) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (n <= 1) next.delete('page');
      else next.set('page', String(n));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const filterMount = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!filterMount.current) {
      filterMount.current = true;
      return;
    }
    setPage(1);
  }, [category.join(','), brands.join(','), sortType, debouncedSearch, showSearch, setPage]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const sortParam = sortType === 'low-high' ? 'price' : sortType === 'high-low' ? '-price' : undefined;
        const params = { page, limit: PAGE_SIZE };
        if (category.length) params.categories = category.join(',');
        if (brands.length) params.brands = brands.join(',');
        if (sortParam) params.sort = sortParam;
        if (showSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();

        const response = await axios.get(
          `${backendUrl}/api/v2/products`,
          { params, signal: controller.signal, withCredentials: true }
        );
        if (response.data.success) {
          setItems(response.data.data || []);
          setTotalPages(response.data.totalPages || 1);
          setTotal(response.data.total ?? 0);
          if (response.data.filters) {
            setFilterOptions(response.data.filters);
          }
        }
      } catch (e) {
        if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [backendUrl, page, category, brands, sortType, debouncedSearch, showSearch]);

  const toggleCategory = (e) => {
    const v = e.target.value;
    if (category.includes(v)) {
      setCategory(prev => prev.filter(item => item !== v));
    } else {
      setCategory(prev => [...prev, v]);
    }
  }

  const toggleBrands = (e) => {
    const v = e.target.value;
    if (brands.includes(v)) {
      setBrands(prev => prev.filter(item => item !== v));
    } else {
      setBrands(prev => [...prev, v]);
    }
  }

  const cats = filterOptions.categories?.length ? filterOptions.categories : [];
  const brs = filterOptions.brands?.length ? filterOptions.brands : [];

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t border-gray-100'>

      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>Bộ lọc tìm kiếm
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>

        <div className={`border border-gray-200 rounded-xl pl-5 py-3 mt-6 bg-white shadow-sm ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>Danh mục</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {cats.map((c) => (
              <p className='flex gap-2' key={c}>
                <input type="checkbox" className='w-3' value={c} checked={category.includes(c)} onChange={toggleCategory} /> {c}
              </p>
            ))}
          </div>
        </div>

        <div className={`border border-gray-200 rounded-xl pl-5 py-3 my-5 bg-white shadow-sm ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>Thương hiệu</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {brs.map((b) => (
              <p className='flex gap-2' key={b}>
                <input type="checkbox" className='w-3' value={b} checked={brands.includes(b)} onChange={toggleBrands} /> {b}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4 flex-wrap gap-3'>
          <Title text1="Tất cả " text2={"bộ sưu tập"} />
          <select
            className='border-2 border-gray-200 rounded-lg text-sm px-3 py-2 bg-white shadow-sm'
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="relavent">Sắp xếp: Mới nhất</option>
            <option value="low-high">Sắp xếp: Giá thấp → cao</option>
            <option value="high-low">Sắp xếp: Giá cao → thấp</option>
          </select>
        </div>

        <p className='text-gray-500 text-sm mb-4'>{loading ? 'Đang tải…' : `${total} sản phẩm`}</p>

        {loading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='h-64 bg-gray-100 rounded-xl' />
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
            {items.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                name={item.name}
                images={item.images}
                price={item.price}
                soldCount={item.soldCount}
              />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 mt-10 flex-wrap'>
            <button
              type='button'
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className='px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50'
            >
              Trước
            </button>
            <span className='text-sm text-gray-600'>
              Trang {page} / {totalPages}
            </span>
            <button
              type='button'
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className='px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50'
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Collection
