import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Collection from "./pages/Collection.jsx"
import About from "./pages/About.jsx"
import Contact from "./pages/Contact.jsx"
import Cart from "./pages/Cart.jsx"
import PlaceOrder from "./pages/PlayOrder.jsx"
import Orders from "./pages/Orders.jsx"
import Product from './pages/Product.jsx'
import NavBar from './components/NavBar.jsx'
import Footer from './components/Footer.jsx'
import SearchBar from './components/SearchBar.jsx'
import EmailVerificationBanner from './components/EmailVerificationBanner.jsx'
import Chatbot from './components/Chatbot.jsx'
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import PlaceOrderByProductId from './pages/PlaceOrderByProductId.jsx'
import User from './pages/User.jsx'
import Favorites from './pages/Favorites.jsx'
import useShopContext from './hooks/useShopContext.js'

const App = () => {
  const { authChecked } = useShopContext();

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white'>
      <ToastContainer
        position="bottom-right" autoClose={4000}
        hideProgressBar={false} newestOnTop closeOnClick
        pauseOnFocusLoss draggable pauseOnHover theme="light"
      />
      <NavBar />
      <EmailVerificationBanner />
      <SearchBar />
      <main className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
        <Routes>
          <Route path='/'                       element={<Home />} />
          <Route path='/collection'             element={<Collection />} />
          <Route path='/about'                  element={<About />} />
          <Route path='/contact'                element={<Contact />} />
          <Route path='/product/:productId'     element={<Product />} />
          <Route path='/cart'                   element={<Cart />} />
          <Route path='/place-order'            element={<PlaceOrder />} />
          <Route path='/orders'                 element={<Orders />} />
          <Route path='/login'                  element={<Login />} />
          <Route path='/verify'                 element={<Verify />} />
          <Route path='/verify-email'           element={<VerifyEmail />} />
          <Route path='/place-order/:productId' element={<PlaceOrderByProductId />} />
          <Route path='/user'                   element={<User />} />
          <Route path='/favorites'              element={<Favorites />} />
        </Routes>
      </main>
      <Chatbot />
      <Footer />
    </div>
  )
}

export default App
