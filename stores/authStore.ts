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
    initialized: boolean;

    // Actions
    login: (user: User) => void;
    loginAsGuest: () => void;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    initAuthListener: () => Promise<void>;
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
            initialized: false,

            login: (user: User) => set({
                user,
                isAuthenticated: true,
                isLoading: false
            }),

            loginAsGuest: () => {
                const funnyNames = [
                    'Grandmaster Giggles', 'Sir Checkmate', 'Pawn Star', 'Rook n Roll',
                    'Bishop Boogie', 'Knight Rider', 'Queen Bee', 'King Kong',
                    'Chess Munchkin', 'Tactical Toddler', 'Checkmate Charlie', 'Gambit Gus'
                ];
                const randomName = funnyNames[Math.floor(Math.random() * funnyNames.length)];

                set({
                    user: {
                        id: `guest_${Date.now()}`,
                        name: randomName,
                        email: '',
                        provider: 'guest',
                        createdAt: Date.now(),
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            loginWithGoogle: async () => {
                set({ isLoading: true });
                try {
                    const { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('../utils/firebaseConfig');

                    if (!auth) {
                        console.log("Using Mock Auth (No Firebase Config)");
                        // Mock fallback
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

                    // Use popup for both mobile and desktop
                    // Redirect is flaky on some deployments; popup is more reliable if triggered by user action
                    console.log('Using Popup Auth for stability');
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
                    if (!error.message?.includes('redirect')) {
                        alert("Login failed: " + error.message);
                    }
                }
            },

            // Initialize Firebase Auth Listener - The source of truth
            initAuthListener: async () => {
                if (get().initialized) return;

                console.log('Initializing Auth Listener...');
                try {
                    const { auth, onAuthStateChanged, getRedirectResult } = await import('../utils/firebaseConfig');

                    if (!auth) {
                        set({ isLoading: false, initialized: true });
                        return;
                    }

                    // Check for redirect result first (handles the immediate return from Google)
                    // This creates the standard auth state change event if successful
                    if (isMobileBrowser()) {
                        try {
                            await getRedirectResult(auth);
                            console.log('Redirect result check complete');
                        } catch (e) {
                            console.warn('Redirect check failed', e);
                        }
                    }

                    // Listen for state changes (handles persistence and redirect results)
                    onAuthStateChanged(auth, (firebaseUser) => {
                        console.log('Auth State Changed:', firebaseUser?.email);
                        if (firebaseUser) {
                            set({
                                user: {
                                    id: firebaseUser.uid,
                                    name: firebaseUser.displayName || 'Champion',
                                    email: firebaseUser.email || '',
                                    provider: 'google',
                                    createdAt: Date.now()
                                },
                                isAuthenticated: true,
                                isLoading: false,
                            });
                        } else {
                            // Only clear if we were previously authenticated via firebase
                            // Don't clear guest users or if we're just starting up
                            const currentUser = get().user;
                            if (currentUser?.provider === 'google') {
                                set({
                                    user: null,
                                    isAuthenticated: false,
                                    isLoading: false,
                                });
                            } else {
                                // If guest or null, just stop loading
                                set({ isLoading: false });
                            }
                        }
                    });

                    set({ initialized: true });
                } catch (error) {
                    console.error('Auth Listener Error:', error);
                    set({ isLoading: false, initialized: true });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    const { auth } = await import('../utils/firebaseConfig');
                    if (auth) {
                        await auth.signOut();
                    }
                } catch (e) {
                    console.error('Logout error', e);
                }

                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },

            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: 'chess-kids-auth',
            storage: createJSONStorage(() => AsyncStorage),
            // We manually handle init in _layout.tsx
        }
    )
);
