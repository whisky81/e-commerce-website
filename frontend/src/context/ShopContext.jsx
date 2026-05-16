import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { useFavorites } from "../hooks/useFavorites";
import { ShopContext } from "./ShopContextDef";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Public pages that should never redirect to login
const PUBLIC_PATTERNS = [
    "/",
    "/collection",
    "/about",
    "/contact",
    "/product/",
    "/login",
    "/verify-email",
    "/verify",
];

const isPublicPage = (pathname) => {
    return PUBLIC_PATTERNS.some(p => pathname === p || (p.endsWith("/") && pathname.startsWith(p)));
};

const ShopContextProvider = (props) => {
    const currency = '₫';
    const deliveryFee = 20000;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    // UI states
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // ── Single source of auth state ──────────────────────────────────────
    const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

    // Pass auth state as params — hooks no longer call useAuth internally
    const { cartItems, addToCart, updateQuantity, cartCount, cartAmount } = useCart(isAuthenticated);
    const { data: productsData } = useProducts({ limit: 100 });
    const { favoriteIds, toggleFavorite } = useFavorites(user, isAuthenticated);

    const products = productsData?.items || [];
    const filters = productsData?.filters || {};
    const setting = { banner: productsData?.banner || null };

    // ── OAuth callback — runs once on mount ──────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const authResult = params.get("auth");
        const authError  = params.get("error");

        if (authResult === "success") {
            toast.success("Đăng nhập thành công!");
            window.history.replaceState({}, "", window.location.pathname);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        } else if (authError) {
            const messages = {
                google:   "Đăng nhập Google thất bại. Vui lòng thử lại.",
                facebook: "Đăng nhập Facebook thất bại. Vui lòng thử lại.",
            };
            toast.error(messages[authError] || "Đăng nhập OAuth thất bại.");
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []); // eslint-disable-line

    // Listen for 401 — only redirect to login from protected pages
    useEffect(() => {
        const handler = () => {
            if (!isPublicPage(location.pathname)) {
                navigate("/login", { replace: true });
            }
        };
        window.addEventListener("auth:unauthorized", handler);
        return () => window.removeEventListener("auth:unauthorized", handler);
    }, [navigate, location.pathname]);

    // ── Stable callbacks ─────────────────────────────────────────────────
    const addToCartStable = useCallback(addToCart, [addToCart]);
    const updateQuantityStable = useCallback(updateQuantity, [updateQuantity]);
    const toggleFavoriteStable = useCallback(toggleFavorite, [toggleFavorite]);
    const logoutStable = useCallback(logout, [logout]);

    // Memoize context value to prevent cascading re-renders
    const value = useMemo(() => ({
        products,
        currency,
        deliveryFee,
        search, setSearch,
        showSearch, setShowSearch,
        cartItems, addToCart: addToCartStable,
        cartCount, updateQuantity: updateQuantityStable, cartAmount,
        navigate,
        backendUrl,
        filters,
        isAuthenticated,
        user,
        authChecked: !isAuthLoading,
        favoriteIds, toggleFavorite: toggleFavoriteStable,
        logout: logoutStable,
        setting
    }), [
        products, currency, deliveryFee, search, showSearch,
        cartItems, addToCartStable, cartCount, updateQuantityStable, cartAmount,
        navigate, backendUrl, filters, isAuthenticated, user,
        isAuthLoading, favoriteIds, toggleFavoriteStable, logoutStable, setting
    ]);

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
