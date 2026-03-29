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
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import PlaceOrderByProductId from './pages/PlaceOrderByProductId.jsx'
import User from './pages/User.jsx'
import Favorites from './pages/Favorites.jsx'

const App = () => {
  return (
    <div className='min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white'>
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <NavBar />
      <SearchBar />
      <main className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />

          <Route path='/product/:productId' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/orders' element={<Orders />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/verify" element={<Verify />}/>
          <Route path="/place-order/:productId" element={<PlaceOrderByProductId />}/> 
          <Route path="/user" element={<User/>}/>
          <Route path="/favorites" element={<Favorites />} />
          
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
