import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: 'google' | 'apple' | 'guest';
    createdAt: number;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (user: User) => void;
    loginAsGuest: () => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,

            login: (user: User) => set({
                user,
                isAuthenticated: true,
                isLoading: false
            }),

            loginAsGuest: () => set({
                user: {
                    id: `guest_${Date.now()}`,
                    name: 'Little Champion',
                    email: '',
                    provider: 'guest',
                    createdAt: Date.now(),
                },
                isAuthenticated: true,
                isLoading: false,
            }),

            logout: () => set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            }),

            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: 'chess-kids-auth',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);
