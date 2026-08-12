import axios, { AxiosError } from 'axios';
import { signOut } from 'next-auth/react';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';

export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
    const accessToken = useUserSessionStore.getState().accessToken;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            signOut({ callbackUrl: '/' });
        }
        return Promise.reject(error);
    },
);
