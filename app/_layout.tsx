import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
    const { checkRedirectResult, setLoading } = useAuthStore();

    useEffect(() => {
        // Check for redirect result on mobile browsers (after Google auth redirect)
        const checkAuth = async () => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    await checkRedirectResult();
                } catch (error) {
                    console.error('Error checking redirect result:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        // Small delay to ensure Firebase is fully initialized
        const timer = setTimeout(checkAuth, 500);
        return () => clearTimeout(timer);
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
        </GestureHandlerRootView>
    );
}
