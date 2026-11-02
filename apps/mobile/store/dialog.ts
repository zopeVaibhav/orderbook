import { create } from 'zustand';

export interface DialogOptions {
    title: string;
    message?: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    dismissable?: boolean;
}

interface DialogState {
    current: (DialogOptions & { id: number }) | null;
    resolve: ((confirmed: boolean) => void) | null;
    open: (options: DialogOptions) => Promise<boolean>;
    close: (confirmed: boolean) => void;
}

let nextId = 1;

export const useDialog = create<DialogState>((set, get) => ({
    current: null,
    resolve: null,
    open: (options) =>
        new Promise<boolean>((resolve) => {
            get().resolve?.(false);
            set({
                current: { cancelLabel: 'Cancel', dismissable: true, ...options, id: nextId++ },
                resolve,
            });
        }),
    close: (confirmed) => {
        const { resolve } = get();
        set({ current: null, resolve: null });
        resolve?.(confirmed);
    },
}));

export const dialog = {
    confirm: (options: DialogOptions) => useDialog.getState().open(options),
};
