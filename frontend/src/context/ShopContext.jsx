import { createContext, useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"
export const ShopContext = createContext();
import axios from "axios"

const ShopContextProvider = (props) => {
    const currency = '₫';
    const deliveryFee = 20000;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const navigate = useNavigate();
    const [products, setProducts] = useState([])
    const [filters, setFilters] = useState({});
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [setting, setSetting] = useState({});

    const my = async () => {
        try {
            const response = await axios.get(backendUrl + "/api/v2/users/profile", { withCredentials: true })
            if (!response.data.success) throw new Error(response.data.message);
            setUser(response.data.data);
            setFavoriteIds(response.data.data.favoriteIds || []);
        } catch (error) {
            // Silently fail — user may not be logged in
        }
    }

    const toggleFavorite = async (productId) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để dùng yêu thích");
            navigate("/login");
            return;
        }
        const isFav = favoriteIds.some(id => id === productId || id?.toString?.() === productId);
        try {
            if (isFav) {
                await axios.delete(backendUrl + `/api/v2/users/favorites/${productId}`, { withCredentials: true });
                setFavoriteIds(prev => prev.filter(id => id?.toString?.() !== productId?.toString?.()));
                toast.success("Đã xóa khỏi yêu thích");
            } else {
                await axios.post(backendUrl + `/api/v2/users/favorites/${productId}`, {}, { withCredentials: true });
                setFavoriteIds(prev => [...prev, productId]);
                toast.success("Đã thêm vào yêu thích");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const cartHelper = async (productId, quantity) => {
        try {
            const response = await axios.post(backendUrl + "/api/v2/cart", { productId, quantity }, { withCredentials: true })
            if (response.status === 401) { navigate("/login"); return; }
            if (!response.data.success) throw new Error(response.data.message);
        } catch (error) {
            toast.error(error.message);
        }
    }

    // price: pass the effective/discounted price
    const addToCart = async (id, name, image, price, salePrice) => {
        const effectivePrice = salePrice && salePrice < price ? salePrice : price;
        let cartData = structuredClone(cartItems);
        if (cartData[id]) {
            cartData[id].quantity += 1;
            cartData[id].price = effectivePrice; // update price in case discount changed
        } else {
            cartData[id] = { id, name, image, price: effectivePrice, quantity: 1 }
        }
        setCartItems(cartData);
        if (isAuthenticated) await cartHelper(id, cartData[id].quantity);
    }

    const updateQuantity = async (productId, quantity) => {
        let cartData = structuredClone(cartItems);
        if (quantity > 0) {
            cartData[productId].quantity = quantity;
        } else {
            delete cartData[productId];
        }
        setCartItems(cartData);
        if (isAuthenticated) {
            if (quantity === 0) {
                try {
                    const response = await axios.delete(backendUrl + `/api/v2/cart/${productId}`, { withCredentials: true })
                    if (response.data.success) toast.success(response.data.message);
                    else throw new Error(response.data.message);
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
            const response = await axios.get(backendUrl + "/api/v2/cart", { withCredentials: true })
            if (response.status === 401) { navigate("/login"); return; }
            if (response.data.success) {
                const tmp = {};
                for (const cartData of response.data.data) {
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
            // Silently handle
        }
    }

    const cartCount = () => Object.values(cartItems).reduce((acc, item) => acc + item.quantity, 0)

    const cartAmount = () => Object.values(cartItems).reduce((acc, item) => acc + item.quantity * item.price, 0)

    const fetchProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + "/api/v2/products?limit=100", { withCredentials: true })
            if (response.data.success) {
                setProducts(response.data.data)
                setFilters(response.data.filters)
                setSetting({ banner: response.data.banner })
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => { fetchProductsData() }, [])

    useEffect(() => {
        if (!isAuthenticated && localStorage.getItem("isAuth")) {
            setIsAuthenticated(localStorage.getItem("isAuth"));
            getUserCart();
        }
        if (isAuthenticated) {
            getUserCart();
            my();
        } else {
            setFavoriteIds([]);
        }
    }, [isAuthenticated])

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
        setCartItems,
        filters,
        isAuthenticated, setIsAuthenticated,
        user, setUser, my,
        favoriteIds, setFavoriteIds, toggleFavorite,
        setting
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;
