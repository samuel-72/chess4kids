import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
    checkRedirectResult: () => Promise<void>;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

// Helper to detect mobile browser
const isMobileBrowser = (): boolean => {
    if (Platform.OS !== 'web') return false;
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
                    const { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('../utils/firebaseConfig');

                    if (!auth) {
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

                    // Use redirect for mobile browsers (Safari/Chrome block popups)
                    if (isMobileBrowser()) {
                        console.log('Mobile detected, using redirect auth');
                        await signInWithRedirect(auth, provider);
                        // Page will redirect, no need to handle result here
                        return;
                    }

                    // Use popup for desktop
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
                    // Only alert if not a redirect (redirect will navigate away)
                    if (!error.message?.includes('redirect')) {
                        alert("Login failed: " + error.message);
                    }
                }
            },

            // Called on app load to check for redirect result (from _layout.tsx)
            checkRedirectResult: async () => {
                // Only check on mobile browsers
                if (!isMobileBrowser()) {
                    set({ isLoading: false });
                    return;
                }

                console.log('Checking for redirect result...');
                set({ isLoading: true });

                try {
                    const { auth, getRedirectResult } = await import('../utils/firebaseConfig');
                    if (!auth) {
                        console.log('No auth available');
                        set({ isLoading: false });
                        return;
                    }

                    const result = await getRedirectResult(auth);
                    console.log('Redirect result:', result);

                    if (result?.user) {
                        const user = result.user;
                        console.log('User authenticated via redirect:', user.email);
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
                    } else {
                        console.log('No redirect result found');
                        set({ isLoading: false });
                    }
                } catch (error) {
                    console.error("Redirect result error:", error);
                    set({ isLoading: false });
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
                // Don't set loading to false here - let _layout.tsx handle it after checking redirect
                // This prevents race conditions with redirect auth
            },
        }
    )
);
