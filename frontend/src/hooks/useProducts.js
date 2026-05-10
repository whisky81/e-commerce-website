import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct } from '../api/products';

export const useProducts = (params = {}) => {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const res = await fetchProducts(params);
            if (res.data.success) {
                return {
                    items: res.data.data,
                    total: res.data.meta?.total ?? 0,
                    totalPages: res.data.meta?.totalPages ?? 1,
                    filters: res.data.meta?.filters || {},
                    banner: res.data.meta?.banner || null,
                };
            }
            throw new Error('Lỗi tải sản phẩm');
        },
        staleTime: 30 * 1000, // 30s — keep / and /collection soldCount in sync
    });
};

export const useProductDetail = (productId) => {
    return useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const res = await fetchProduct(productId);
            if (res.data.success) {
                return res.data.data;
            }
            throw new Error('Lỗi tải chi tiết sản phẩm');
        },
        enabled: !!productId,
        staleTime: 1000 * 60 * 10,
    });
};
