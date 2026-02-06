import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/home" />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
