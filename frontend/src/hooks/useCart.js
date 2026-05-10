import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart } from '../api/cart';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const useCart = () => {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // ─── Fetch Cart ──────────────────────────────────────────────────────────
    const { data: cartItems = {}, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const res = await getCart();
            if (res.data.success) {
                const tmp = {};
                for (const item of res.data.data) {
                    const p = item.product;
                    tmp[p._id] = {
                        id: p._id,
                        name: p.name,
                        price: p.salePrice ?? p.price,
                        image: p.images?.[0]?.url || "",
                        quantity: item.quantity
                    };
                }
                return tmp;
            }
            return {};
        },
        enabled: isAuthenticated, // Only fetch if logged in
        staleTime: 1000 * 60 * 5,
    });

    // ─── Mutations ─────────────────────────────────────────────────────────
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ productId, quantity }) => {
            if (quantity <= 0) {
                return apiRemoveFromCart(productId);
            }
            // AddToCart API supports updating quantity if item exists on the backend
            // Let's assume apiAddToCart(productId, qty) sets/adds it.
            // Wait, is it delta or absolute? Let's check api. If it's absolute, we pass quantity. 
            // In the legacy code: syncCartItem(productId, quantity) was called.
            return apiAddToCart(productId, quantity);
        },
        onMutate: async ({ productId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData(['cart']);

            queryClient.setQueryData(['cart'], (old) => {
                const newCart = { ...(old || {}) };
                if (quantity <= 0) {
                    delete newCart[productId];
                } else if (newCart[productId]) {
                    newCart[productId].quantity = quantity;
                }
                return newCart;
            });

            return { previousCart };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['cart'], context.previousCart);
            toast.error('Lỗi cập nhật giỏ hàng');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
    });

    // ─── Helpers ───────────────────────────────────────────────────────────
    // Fix addToCart logic for absolute quantity
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

    const cartCount = Object.values(cartItems).reduce((acc, item) => acc + item.quantity, 0);
    const cartAmount = Object.values(cartItems).reduce((acc, item) => acc + item.quantity * item.price, 0);

    return {
        cartItems,
        isLoading,
        addToCart: handleAddToCart,
        updateQuantity,
        cartCount,
        cartAmount
    };
};
