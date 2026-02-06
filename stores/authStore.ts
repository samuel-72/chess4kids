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
    loginWithGoogle: () => Promise<void>;
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

            loginWithGoogle: async () => {
                set({ isLoading: true });
                try {
                    // Dynamic import to avoid crash if firebase isn't configured
                    const { auth, GoogleAuthProvider, signInWithPopup } = await import('../utils/firebaseConfig');

                    if (!auth) {
                        // Fallback to mock if no config
                        console.log("Using Mock Auth (No Firebase Config)");
                        setTimeout(() => {
                            set({
                                user: {
                                    id: 'guest-mock',
                                    name: 'Champion',
                                    email: 'mock@example.com',
                                    provider: 'guest',
                                    createdAt: Date.now()
                                },
                                isAuthenticated: true,
                                isLoading: false,
                            });
                        }, 1000);
                        return;
                    }

                    const provider = new GoogleAuthProvider();
                    const result = await signInWithPopup(auth, provider);
                    const user = result.user;

                    set({
                        user: {
                            id: user.uid,
                            name: user.displayName || 'Champion',
                            email: user.email || '',
                            provider: 'google',
                            createdAt: Date.now()
                        },
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    console.error("Login Error:", error);
                    set({ isLoading: false });
                    alert("Login failed: " + error.message);
                }
            },

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
