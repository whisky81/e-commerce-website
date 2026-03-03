import React, { useState, useEffect } from 'react'
import useShopContext from '../hooks/useShopContext'
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {
  const { products, search, showSearch, filters } = useShopContext();
  const [showFilter, setShowFilter] = useState(false)
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sortType, setSortType] = useState('relavent');

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value));
    } else {
      setCategory(prev => [...prev, e.target.value]);
    }
  }

  const toggleBrands = (e) => {
    if (brands.includes(e.target.value)) {
      setBrands(prev => prev.filter(item => item !== e.target.value));
    } else {
      setBrands(prev => [...prev, e.target.value]);
    }
  }


  const applyFilter = () => {
    let productsCopy = products.slice();

    if (showSearch && search.trim() !== '') {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    if (brands.length > 0) {
      productsCopy = productsCopy.filter(item => brands.includes(item.brand));
    }
    
    setFilterProducts(productsCopy);
  }

  const sortProducts = () => {
    let fpCopy = filterProducts.slice();
    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => a.price - b.price));
        break;
      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => b.price - a.price));
        break;
      default:
        applyFilter();
        break;
    }
  }

  useEffect(() => {
    applyFilter();
  }, [category, brands, showSearch, search, products])

  useEffect(() => {
    sortProducts();
  }, [sortType])

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 broder-t'>



      {/* Filter Options */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>Bộ lọc tìm kiếm
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>



        {/* category filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>Danh mục</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {filters.categories && filters.categories.map((category, index) => (
              <p className='flex gap-2' key={index}>
                <input type="checkbox" className='w-3' value={category} onChange={toggleCategory} /> {category}
              </p>
            ))}
          </div>
        </div>



        {/* subcategory filter */}
        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>Thương hiệu</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {filters.brands && filters.brands.map((brand, index) => (
              <p className='flex gap-2' key={index}>
                <input type="checkbox" className='w-3' value={brand} onChange={toggleBrands} /> {brand}
              </p>
            ))}
          </div>
        </div>



      </div>


      {/* right side */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title text1="Tất cả " text2={"bộ sưu tập"} />
          {/* product sort */}
          <select className='border-2 border-gray-300 text-sm px-2' onChange={(e) => setSortType(e.target.value)}>
            <option value="relavent">Sắp xếp theo: Phù hợp nhất</option>
            <option value="low-high">Sắp xếp theo: Giá từ thấp đến cao</option>
            <option value="high-low">Sắp xếp theo: Giá từ cao đến thấp</option>
          </select>
        </div>

        {/* map products */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
          {filterProducts.map((item, index) => (
            <ProductItem key={index} id={item._id} name={item.name} images={item.images} price={item.price} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Collection
