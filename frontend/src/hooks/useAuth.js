import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, loginApi, registerApi, logoutApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // ─── Fetch Profile (Auth State) ──────────────────────────────────────────
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await getProfile();
            if (res.data.success) return res.data.data;
            throw new Error('Not authenticated');
        },
        retry: false, // Don't retry if 401
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: true,
    });

    const user = data || null;
    const isAuthenticated = !!user;

    // ─── Mutations ─────────────────────────────────────────────────────────
    const loginMutation = useMutation({
        mutationFn: ({ email, password }) => loginApi(email, password),
        onSuccess: async (res) => {
            if (res.data.success) {
                toast.success('Đăng nhập thành công');
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
                await queryClient.invalidateQueries({ queryKey: ['cart'] });
                navigate('/');
            } else {
                toast.error(res.data.message || 'Lỗi đăng nhập');
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
        }
    });

    const registerMutation = useMutation({
        mutationFn: ({ name, email, password }) => registerApi(name, email, password),
        onSuccess: async (res) => {
            if (res.data.success) {
                toast.success('Đăng ký thành công');
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
                navigate('/');
            } else {
                toast.error(res.data.message || 'Lỗi đăng ký');
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Đăng ký thất bại');
        }
    });

    const logoutMutation = useMutation({
        mutationFn: () => logoutApi(),
        onSuccess: () => {
            queryClient.setQueryData(['profile'], null);
            queryClient.setQueryData(['cart'], null);
            toast.success('Đã đăng xuất');
            navigate('/login');
        },
        onError: () => {
            // Force local logout even if API fails
            queryClient.setQueryData(['profile'], null);
            navigate('/login');
        }
    });

    // ─── Expose OAuth helper to clean up URL ──────────────────────────────
    const handleOAuthCallback = () => {
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
    };

    return {
        user,
        isAuthenticated,
        isLoading: isLoading,
        isError,
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,
        logout: logoutMutation.mutate,
        handleOAuthCallback,
    };
};
