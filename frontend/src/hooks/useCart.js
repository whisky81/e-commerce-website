import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart } from '../api/cart';
import { toast } from 'react-toastify';

export const useCart = (isAuthenticated = false) => {
    const queryClient = useQueryClient();

    // ─── Fetch Cart ──────────────────────────────────────────────────────────
    const { data: cartItems = {}, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const res = await getCart();
            if (res.data.success) {
                const tmp = {};
                for (const item of res.data.data) {
                    const p = item.product;
                    const displayPrice = p.salePrice ?? p.price;
                    const hasDiscount = p.salePrice != null && p.salePrice < p.price;
                    tmp[p._id] = {
                        id: p._id,
                        name: p.name,
                        price: displayPrice,
                        originalPrice: hasDiscount ? p.price : null,
                        discount: hasDiscount ? p.discount : null,
                        image: p.images?.[0]?.url || "",
                        quantity: item.quantity
                    };
                }
                return tmp;
            }
            return {};
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // ─── Update Quantity Mutation ───────────────────────────────────────────
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ productId, quantity }) => {
            if (quantity <= 0) {
                return apiRemoveFromCart(productId);
            }
            return apiAddToCart(productId, quantity);
        },
        onMutate: async ({ productId, quantity, optimisticData }) => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData(['cart']);

            queryClient.setQueryData(['cart'], (old) => {
                const newCart = { ...(old || {}) };
                if (quantity <= 0) {
                    delete newCart[productId];
                } else {
                    newCart[productId] = {
                        ...(newCart[productId] || {}),
                        quantity,
                        ...(optimisticData || {}),
                    };
                }
                return newCart;
            });

            return { previousCart };
        },
        onError: (err, variables, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast.error(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng');
        },
    });

    // ─── Add to Cart helper ─────────────────────────────────────────────────
    const handleAddToCart = (id, name, image, price, salePrice) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để mua hàng");
            return;
        }
        const currentQty = cartItems[id]?.quantity || 0;
        const newQty = currentQty + 1;
        const effectivePrice = salePrice && salePrice < price ? salePrice : price;
        const imageUrl = typeof image === 'object' ? image?.url || "" : image || "";

        updateQuantityMutation.mutate({
            productId: id,
            quantity: newQty,
            optimisticData: { id, name, price: effectivePrice, image: imageUrl }
        });
        toast.success("Đã thêm vào giỏ hàng");
    };

    const updateQuantity = (productId, quantity) => {
        updateQuantityMutation.mutate({ productId, quantity });
    };

    const cartCount = typeof cartItems === 'object'
        ? Object.values(cartItems).reduce((acc, item) => acc + (item?.quantity || 0), 0)
        : 0;

    const cartAmount = typeof cartItems === 'object'
        ? Object.values(cartItems).reduce((acc, item) => acc + (item?.quantity || 0) * (item?.price || 0), 0)
        : 0;

    return {
        cartItems,
        isLoading,
        addToCart: handleAddToCart,
        updateQuantity,
        cartCount,
        cartAmount
    };
};
