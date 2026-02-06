import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/home');
            } else {
                router.replace('/login');
            }
        }
    }, [isAuthenticated, isLoading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
