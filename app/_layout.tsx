import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import DebugOverlay from '../components/DebugOverlay';

export default function RootLayout() {
    const { initAuthListener } = useAuthStore();

    useEffect(() => {
        // Initialize the auth listener on app mount
        if (Platform.OS === 'web') {
            initAuthListener();

            // CRITICAL CSS FIX for Mobile Web
            if (typeof window !== 'undefined') {
                const style = document.createElement('style');
                style.textContent = `
                    html, body, #root { 
                        height: 100%; 
                        width: 100%;
                        /* Allow scrolling if content overflows */
                        overflow: auto; 
                        -webkit-overflow-scrolling: touch;
                        margin: 0;
                        padding: 0;
                        background-color: ${colors.background};
                    }
                    /* Ensure touch actions work correctly */
                    body {
                        -webkit-touch-callout: none;
                        -webkit-user-select: none;
                        user-select: none;
                    }
                    /* Allow text selection in inputs */
                    input, textarea {
                        -webkit-user-select: text;
                        user-select: text;
                    }
                `;
                document.head.appendChild(style);
                console.log('Mobile Web CSS Fix Injected');
            }
        }
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                }}
            />
            {/* INJECT DEBUG OVERLAY */}
            <DebugOverlay />
        </GestureHandlerRootView>
    );
}
