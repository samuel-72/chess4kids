import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
    const { initAuthListener } = useAuthStore();

    useEffect(() => {
        // Initialize the auth listener on app mount
        // This handles persistent sessions and redirect results
        if (Platform.OS === 'web') {
            initAuthListener();
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
        </GestureHandlerRootView>
    );
}
