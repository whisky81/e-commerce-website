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
                    total: res.data.total,
                    totalPages: res.data.totalPages,
                    filters: res.data.meta?.filters || res.data.filters || {},
                    banner: res.data.meta?.banner || null,
                };
            }
            throw new Error('Lỗi tải sản phẩm');
        },
        staleTime: 1000 * 60 * 5, // 5 mins
        keepPreviousData: true,
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
