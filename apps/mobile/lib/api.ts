import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSession } from '@/store/session';
import { API_URL } from './api-routes';
import { refreshSession, signOut } from './auth';

export const api = create({ baseURL: API_URL, timeout: 15_000 });

const retried = new WeakSet<InternalAxiosRequestConfig>();
let refreshing: Promise<boolean> | null = null;

api.interceptors.request.use((config) => {
    const token = useSession.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config;
        if (error.response?.status !== 401 || !config || retried.has(config)) {
            return Promise.reject(error);
        }
        retried.add(config);
        refreshing ??= refreshSession().finally(() => {
            refreshing = null;
        });
        if (!(await refreshing)) {
            await signOut();
            return Promise.reject(error);
        }
        return api(config);
    },
);
