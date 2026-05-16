import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, loginApi, registerApi, logoutApi } from '../api/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCallback, useMemo } from 'react';

// Pages where the profile query should never fire
const AUTH_PAGES = ['/login', '/verify-email', '/verify'];

export const useAuth = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthPage = useMemo(
        () => AUTH_PAGES.includes(location.pathname),
        [location.pathname]
    );

    // Fetch Profile (Auth State)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await getProfile();
            if (res.data.success) return res.data.data;
            throw new Error('Not authenticated');
        },
        retry: false,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,         // keep in cache for 30 min even after unmount
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,          // no polling
        enabled: !isAuthPage,
    });

    const user = data ?? null;
    const isAuthenticated = !!user;

    // Login Mutation
    const loginMutation = useMutation({
        mutationFn: ({ email, password }) => loginApi(email, password),
        onSuccess: async (res) => {
            if (res.data.success) {
                toast.success(res.data.message || 'Đăng nhập thành công');
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
                const redirectUrl = res.data?.data?.redirectUrl;
                if (redirectUrl && redirectUrl !== window.location.origin) {
                    window.location.href = redirectUrl;
                } else {
                    navigate('/');
                }
            } else {
                toast.error(res.data.message || 'Lỗi đăng nhập');
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
        }
    });

    // Register Mutation
    const registerMutation = useMutation({
        mutationFn: ({ name, email, password }) => registerApi(name, email, password),
        onSuccess: async (res) => {
            if (res.data.success) {
                toast.success(res.data.message || 'Đăng ký thành công');
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

    // Logout Mutation — targeted cleanup instead of clear()
    const logoutMutation = useMutation({
        mutationFn: () => logoutApi(),
        onSuccess: () => {
            // Set profile to null (logged out) — keeps it in cache so it won't re-fire
            queryClient.setQueryData(['profile'], null);
            queryClient.removeQueries({ queryKey: ['cart'] });
            toast.success('Đã đăng xuất');
            navigate('/login');
        },
        onError: () => {
            queryClient.setQueryData(['profile'], null);
            queryClient.removeQueries({ queryKey: ['cart'] });
            navigate('/login');
        }
    });

    // OAuth callback handler
    const handleOAuthCallback = useCallback(() => {
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
    }, [queryClient]);

    const login    = useCallback((creds) => loginMutation.mutate(creds), [loginMutation.mutate]);
    const register = useCallback((creds) => registerMutation.mutate(creds), [registerMutation.mutate]);
    const logout   = useCallback(() => logoutMutation.mutate(), [logoutMutation.mutate]);

    return {
        user,
        isAuthenticated,
        isLoading,
        isError,
        login,
        loginAsync: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        register,
        isRegistering: registerMutation.isPending,
        logout,
        handleOAuthCallback,
    };
};
