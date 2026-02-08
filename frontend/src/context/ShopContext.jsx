import { createContext, useEffect, useState } from "react";
// import { products } from "../assets/assets";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"
export const ShopContext = createContext();
import axios from "axios"

const ShopContextProvider = (props) => {
    const currency = '$';
    const deliveryFee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const navigate = useNavigate();
    const [products, setProducts] = useState([])
    const [token, setToken] = useState('')
    const addToCart = async (itemId, size) => {
        if (size === "") {
            toast.error('Select product size');
            return;
        }
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {}
            cartData[itemId][size] = 1 
        }
        setCartItems(cartData);
    }

    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);
    }

    const cartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item]
                    }
                } catch (error) {
                    
                }
            }
        }
        return totalCount;
    }


    const cartAmount = () => {
        let total = 0;
        for (const itemId in cartItems) {
            let itemInfo = products.find((item)=>item._id === itemId);
            for (const size in cartItems[itemId]) {
                try {
                    if (cartItems[itemId][size] > 0) {
                        total += cartItems[itemId][size] * itemInfo.price;
                    }
                } catch (error) {
                    
                }
                
            }
        }
        return total;
    }
    const  fetchProductsData = async () => {
        try {
            const response = await axios.get(
                backendUrl + '/api/product/list'
            )
            // console.log(response.data)
            if (response.data.success) {
                setProducts(response.data.products)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }    
    useEffect(() => {
        fetchProductsData()
    }, [])
    useEffect(()=>{
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
        }
    },[])

    const value = {
        products,
        currency,
        deliveryFee,
        search, setSearch,
        showSearch, setShowSearch,
        cartItems, addToCart,
        cartCount, updateQuantity, cartAmount,
        navigate,
        backendUrl,
        token, setToken,
        setCartItems
    };
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;