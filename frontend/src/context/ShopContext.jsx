import { createContext, useEffect, useState } from "react";
// import { products } from "../assets/assets";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"
export const ShopContext = createContext();
import axios from "axios"

const ShopContextProvider = (props) => {
    const currency = '$';
    const deliveryFee = 20000;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const navigate = useNavigate();
    const [products, setProducts] = useState([])
    const [token, setToken] = useState('')
    const [filters, setFilters] = useState({});
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const my = async () => {
        try {
            const response = await axios.get(
                backendUrl + "/api/v2/users/profile",
                {withCredentials: true}
            )
            if (!response.data.success) {
                throw new Error(response.data.message);
            }
            setUser(response.data.data);
        } catch (error) {
            toast.error(error.message);
        }
    }

    const cartHelper = async (productId, quantity) => {
        try {
                const response = await axios.post(
                    backendUrl + "/api/v2/cart",
                    {
                        productId,
                        quantity
                    },
                    {
                        withCredentials: true 
                    }
                )
                if (response.status === 401) {
                    navigate("/login");
                    return;
                }
                if (response.data.success) {
                    toast.success(response.data.message);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
    }

    const addToCart = async (id, name, image, price) => {
        let cartData = structuredClone(cartItems);
        if (cartData[id]) {
            cartData[id].quantity += 1;
        } else {
            cartData[id] = {
                id,
                name,
                image,
                price,
                quantity: 1
            }
        }
        setCartItems(cartData);
        if (isAuthenticated) {
            await cartHelper(id, cartData[id].quantity);
        }
    }

    const updateQuantity = async (productId, quantity) => {
        let delFlag = quantity === 0;
        let cartData = structuredClone(cartItems);
        if (quantity > 0) {
            cartData[productId].quantity = quantity;
        } else {
            delete cartData[productId];
        }
        setCartItems(cartData);
        if (isAuthenticated) {
            if (delFlag) {
                try {
                    const response = await axios.delete(
                        backendUrl + `/api/v2/cart/${productId}`,
                        {withCredentials: true}
                    )
                    if (response.data.success) {
                        toast.success(response.data.message);
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    toast.error(error.message);
                }
            } else {
                await cartHelper(productId, quantity);
            }
        }
    }

    const getUserCart = async () => {
        try {
            const response = await axios.get(
                backendUrl + "/api/v2/cart",
                {
                    withCredentials: true 
                }
            )
            if (response.status === 401) {
                navigate("/login");
                return;
            }
            if (response.data.success) {
                const tmp = {};
                const data = response.data.data;
                for (const cartData of data) {
                    tmp[cartData.product._id] = {
                        id: cartData.product._id,
                        name: cartData.product.name,
                        price: cartData.product.price,
                        image: cartData.product.images[0],
                        quantity: cartData.quantity
                    }
                } 
                setCartItems(tmp);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const cartCount = () => {
        let totalCount = 0;
        for (const productId in cartItems) {
            totalCount += cartItems[productId].quantity;
        }
        return totalCount;
    }


    const cartAmount = () => {
        let total = 0;
        for (const productId in cartItems) {
            total += cartItems[productId].quantity * cartItems[productId].price;
        }
        return total;
    }
    const  fetchProductsData = async () => {
        try {
            const response = await axios.get(
                backendUrl + "/api/v2/products?limit=20",
                {
                    withCredentials: true 
                }
            )
            if (response.data.success) {
                setProducts(response.data.data)
                setFilters(response.data.filters)
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }    
    useEffect(() => {
        fetchProductsData()
    }, [])
    useEffect(()=>{
        if (!isAuthenticated && localStorage.getItem("isAuth")) {
            setIsAuthenticated(localStorage.getItem("isAuth"));
            getUserCart();
        }
        if (isAuthenticated) {
            getUserCart();
            my();
        }
    },[isAuthenticated])

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
        setCartItems,
        filters,
        isAuthenticated, setIsAuthenticated,
        user, setUser, my
    };
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;