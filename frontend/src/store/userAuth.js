import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,

            setToken: (newToken) => set({ token: newToken }),

            logout: () => set({ token: null }),
        }),
        {
            name: 'auth-token-storage',
        }
    )
);