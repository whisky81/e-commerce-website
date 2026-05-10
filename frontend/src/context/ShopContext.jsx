import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { useFavorites } from "../hooks/useFavorites";
import { ShopContext } from "./ShopContextDef";

const ShopContextProvider = (props) => {
    const currency = '₫';
    const deliveryFee = 20000;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    // UI states
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // React Query Hooks
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { cartItems, addToCart, updateQuantity, cartCount, cartAmount } = useCart();
    const { data: productsData } = useProducts({ limit: 100 });
    const { favoriteIds, toggleFavorite } = useFavorites();

    const products = productsData?.items || [];
    const filters = productsData?.filters || {};
    const setting = { banner: productsData?.banner || null };

    // Listen for 401 unauthorized to navigate to login
    // The useAuth hook handles the actual query clearing via invalidation and logout function
    // but the apiClient throws a window event. We can navigate here.
    useEffect(() => {
        const handler = () => navigate("/login");
        window.addEventListener("auth:unauthorized", handler);
        return () => window.removeEventListener("auth:unauthorized", handler);
    }, [navigate]);

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
        filters,
        isAuthenticated,
        user,
        authChecked: !isAuthLoading,
        favoriteIds, toggleFavorite,
        setting
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;

