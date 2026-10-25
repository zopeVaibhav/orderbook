import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
    id: number;
    message: string | null;
    tone: ToastTone;
}

export const useToast = create<ToastState>(() => ({ id: 0, message: null, tone: 'info' }));

export function showToast(message: string, tone: ToastTone = 'info'): void {
    useToast.setState((s) => ({ id: s.id + 1, message, tone }));
}

export function hideToast(id: number): void {
    if (useToast.getState().id === id) useToast.setState({ message: null });
}
