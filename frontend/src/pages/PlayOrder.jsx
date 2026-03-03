import React, { useEffect, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import useShopContext from '../hooks/useShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import ProductRow from '../components/ProductRow'


const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    cartItems,
    setCartItems,
    user, 
    my
  } = useShopContext();
  const [method, setMethod] = useState('cod');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: ''
  });

  const addAddr = async () => {
    try {
      // Validate form
      if (!newAddress.fullName || !newAddress.phone || !newAddress.street || 
          !newAddress.ward || !newAddress.district || !newAddress.province) {
        toast.warning('Vui lòng điền đầy đủ thông tin');
        return;
      }

      const data = structuredClone(newAddress);
      data.isDefault = false;
      
      const response = await axios.post(
        backendUrl + "/api/v2/users/addresses",
        data,
        {
          withCredentials: true 
        }
      );
      
      // Fix logic kiểm tra response
      if (!response.data.success) {
        throw new Error(response.data.message || 'Có lỗi xảy ra');
      }
      
      toast.success(response.data.message || 'Thêm địa chỉ thành công');
      
      // Reset form
      setNewAddress({
        fullName: '',
        phone: '',
        street: '',
        ward: '',
        district: '',
        province: ''
      });
      
      setShowAddAddressForm(false);
      setShowAddressPopup(false);
      
      // Refresh user data
      await my();
      
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi thêm địa chỉ');
    }
  };

  useEffect(() => {
    if (user?.addresses) {
      const defaultAddr = user.addresses.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddr || user.addresses[0] || null);
    }
  }, [user]);

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressPopup(false);
  };

  const handleNewAddressChange = (e) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();

      if (!selectedAddress) {
        toast.warning('Vui lòng chọn địa chỉ giao hàng');
        return;
      }
      
      let response;
      switch (method) {
        case 'cod':
          response = await axios.post(
            backendUrl + "/api/v2/orders/place",
            {
              addressId: selectedAddress._id
            },
            {
              withCredentials: true
            }
          );
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          if (!response.data.success) {
            throw new Error(response.data.message);
          }
          toast.success(response.data.message);
          setCartItems({});
          navigate('/orders');
          break;
          
        case 'stripe':
          response = await axios.post(
            backendUrl + "/api/v2/orders/stripe",
            {
              addressId: selectedAddress._id
            },
            {
              withCredentials: true
            }
          );
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          if (!response.data.success) {
            throw new Error(response.data.message);
          }
          const sessionUrl = response.data.data.session_url;
          window.location.replace(sessionUrl);
          break;
          
        default:
          break;
      }
    } catch (error) {
      toast.error(error.message)
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className='flex flex-col lg:flex-row justify-between gap-8 pt-5 sm:pt-14 min-h-[80vh] border-t px-4 md:px-8 max-w-7xl mx-auto'
    >
      {/* Left side */}
      <div className='flex flex-col gap-6 w-full lg:w-2/3'>
        <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
          <div className='mb-4'>
            <Title text1='Thông Tin' text2='Sản Phẩm' />
          </div>
          <div className='space-y-3 max-h-96 overflow-y-auto pr-2'>
            {Object.keys(cartItems).map((id) => (
              <div key={id} className='bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow'>
                <ProductRow
                  image={cartItems[id].image}
                  name={cartItems[id].name}
                  productId={id}
                  price={cartItems[id].price}
                  quantity={cartItems[id].quantity}
                />
              </div>
            ))}
          </div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
          <div className='mb-4'>
            <Title text1='Thông Tin' text2='Giao Hàng' />
          </div>

          {selectedAddress ? (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <p className='font-medium text-gray-800'>{selectedAddress.fullName}</p>
                  <p className='text-sm text-gray-600 mt-1'>{selectedAddress.phone}</p>
                  <p className='text-sm text-gray-600 mt-1'>
                    {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressPopup(true)}
                  className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                >
                  Thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center py-8 bg-gray-50 rounded-lg'>
              <p className='text-gray-500 mb-3'>Bạn chưa chọn địa chỉ giao hàng</p>
              <button
                type="button"
                onClick={() => setShowAddressPopup(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
              >
                Chọn địa chỉ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className='w-full lg:w-1/3 mt-6 lg:mt-0'>
        <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24'>
          <div className='mb-8'>
            <CartTotal />
          </div>
          <div className='mb-6'>
            <Title text1='Phương Thức' text2='Thanh Toán' />
            <div className='flex flex-col gap-3 mt-4'>
              <div
                onClick={() => setMethod('stripe')}
                className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${method === 'stripe'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`min-w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'stripe' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                  {method === 'stripe' && <div className='w-3 h-3 bg-blue-500 rounded-full'></div>}
                </div>
                <img className='h-6' src={assets.stripe_logo} alt="Stripe" />
                <span className='font-medium text-gray-700'>Stripe</span>
              </div>
              <div
                onClick={() => setMethod('cod')}
                className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${method === 'cod'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`min-w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                  {method === 'cod' && <div className='w-3 h-3 bg-blue-500 rounded-full'></div>}
                </div>
                <span className='font-medium text-gray-700'>Thanh toán khi nhận hàng</span>
              </div>
            </div>
          </div>
          <div className='w-full'>
            <button
              type="submit"
              className='w-full bg-black text-white py-4 px-6 rounded-xl text-sm font-medium hover:bg-gray-800 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={!selectedAddress}
            >
              {selectedAddress ? 'Mua ngay' : 'Vui lòng chọn địa chỉ'}
            </button>
          </div>
        </div>
      </div>

      {/* Address Selection Popup */}
      {showAddressPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
            <div className='flex justify-between items-center p-6 border-b'>
              <h3 className='text-xl font-semibold'>Chọn địa chỉ giao hàng</h3>
              <button
                type="button"  // QUAN TRỌNG: Thêm type="button"
                onClick={() => {
                  setShowAddressPopup(false);
                  setShowAddAddressForm(false);
                }}
                className='text-gray-400 hover:text-gray-600 transition'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Popup Content */}
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              {!showAddAddressForm ? (
                <>
                  {/* Address List */}
                  <div className='space-y-3'>
                    {user?.addresses?.map((address) => (
                      <div
                        key={address._id}
                        onClick={() => handleSelectAddress(address)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedAddress?._id === address._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='font-medium text-gray-800'>{address.fullName}</p>
                            <p className='text-sm text-gray-600 mt-1'>{address.phone}</p>
                            <p className='text-sm text-gray-600 mt-1'>
                              {address.street}, {address.ward}, {address.district}, {address.province}
                            </p>
                          </div>
                          {selectedAddress?._id === address._id && (
                            <span className='text-blue-600'>
                              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Address Button */}
                  <button
                    type="button"  // QUAN TRỌNG: Thêm type="button"
                    onClick={() => setShowAddAddressForm(true)}
                    className='mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2'
                  >
                    <span>+</span>
                    Thêm địa chỉ mới
                  </button>
                </>
              ) : (
                <>
                  {/* Add Address Form */}
                  <h4 className='font-medium mb-4'>Thêm địa chỉ mới</h4>
                  <div className='space-y-3'>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Họ và tên *"
                      value={newAddress.fullName}
                      onChange={handleNewAddressChange}
                      className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Số điện thoại *"
                      value={newAddress.phone}
                      onChange={handleNewAddressChange}
                      className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                    <input
                      type="text"
                      name="street"
                      placeholder="Số nhà, tên đường *"
                      value={newAddress.street}
                      onChange={handleNewAddressChange}
                      className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <input
                        type="text"
                        name="ward"
                        placeholder="Phường/Xã *"
                        value={newAddress.ward}
                        onChange={handleNewAddressChange}
                        className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                      />
                      <input
                        type="text"
                        name="district"
                        placeholder="Quận/Huyện *"
                        value={newAddress.district}
                        onChange={handleNewAddressChange}
                        className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                      />
                    </div>
                    <input
                      type="text"
                      name="province"
                      placeholder="Tỉnh/Thành phố *"
                      value={newAddress.province}
                      onChange={handleNewAddressChange}
                      className='border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                  </div>
                </>
              )}
            </div>

            {/* Popup Footer */}
            <div className='border-t p-6 flex justify-end gap-3'>
              {showAddAddressForm ? (
                <>
                  <button
                    type="button"  // QUAN TRỌNG: Thêm type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition'
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"  // QUAN TRỌNG: Thêm type="button"
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition' 
                    onClick={addAddr}
                  >
                    Lưu địa chỉ
                  </button>
                </>
              ) : (
                <button
                  type="button"  // QUAN TRỌNG: Thêm type="button"
                  onClick={() => setShowAddressPopup(false)}
                  className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition'
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default PlaceOrder