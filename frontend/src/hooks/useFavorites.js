import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '../api/users';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const useFavorites = () => {
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const favoriteIds = user?.favorites || [];

    const toggleFavoriteMutation = useMutation({
        mutationFn: async ({ productId, isFav }) => {
            if (isFav) {
                return apiRemoveFavorite(productId);
            } else {
                return apiAddFavorite(productId);
            }
        },
        onMutate: async ({ productId, isFav }) => {
            await queryClient.cancelQueries({ queryKey: ['profile'] });
            const previousProfile = queryClient.getQueryData(['profile']);

            queryClient.setQueryData(['profile'], (old) => {
                if (!old) return old;
                const updatedFavs = isFav 
                    ? old.favorites.filter(id => String(id) !== String(productId))
                    : [...(old.favorites || []), productId];
                return { ...old, favorites: updatedFavs };
            });

            return { previousProfile };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['profile'], context.previousProfile);
            toast.error(err.response?.data?.message || 'Lỗi cập nhật yêu thích');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
    });

    const toggleFavorite = (productId) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để dùng yêu thích");
            navigate("/login");
            return;
        }
        const isFav = favoriteIds.some(id => String(id) === String(productId) || id?.toString?.() === productId);
        toggleFavoriteMutation.mutate({ productId, isFav });
        if (isFav) {
            toast.success("Đã xóa khỏi yêu thích");
        } else {
            toast.success("Đã thêm vào yêu thích");
        }
    };

    return {
        favoriteIds,
        toggleFavorite,
        isUpdating: toggleFavoriteMutation.isPending
    };
};
