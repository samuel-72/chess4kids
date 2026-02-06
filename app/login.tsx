import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    ImageBackground,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { loginWithGoogle, loginAsGuest, isAuthenticated, user } = useAuthStore();

    // Loop animation for background float
    const floatY = useSharedValue(0);

    useEffect(() => {
        if (isAuthenticated && user) {
            router.replace('/home');
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        floatY.value = withRepeat(
            withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
    }, []);

    const animatedBgStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Animated Background Gradient */}
            <LinearGradient
                colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Optional: Add a subtle texture or stars image here if available */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedBgStyle]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0)']}
                    style={{ width: '200%', height: '200%', transform: [{ rotate: '45deg' }] }}
                />
            </Animated.View>

            <View style={styles.content}>
                {/* Logo / Title Area */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.titleContainer}>
                    <Text style={styles.emojiIcon}>♟️</Text>
                    <Text style={styles.title}>Chess For Kids</Text>
                    <Text style={styles.subtitle}>Master the Game of Kings</Text>
                </Animated.View>

                {/* Glassmorphism Card */}
                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.cardContainer}>
                    <BlurView intensity={Platform.OS === 'web' ? 80 : 30} tint="dark" style={styles.glassCard}>

                        <Pressable
                            style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.buttonPressed]}
                            onPress={loginWithGoogle}
                        >
                            <Ionicons name="logo-google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.button, styles.appleButton, pressed && styles.buttonPressed]}
                            onPress={() => alert("Apple Sign-In coming soon!")}
                        >
                            <Ionicons name="logo-apple" size={24} color="white" style={{ marginRight: 10 }} />
                            <Text style={styles.appleButtonText}>Continue with Apple</Text>
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>OR</Text>
                            <View style={styles.line} />
                        </View>

                        <Pressable
                            style={({ pressed }) => [styles.button, styles.guestButton, pressed && styles.buttonPressed]}
                            onPress={loginAsGuest}
                        >
                            <Text style={styles.guestButtonText}>Play as Guest 👋</Text>
                        </Pressable>

                    </BlurView>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 400,
        height: '100%',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    emojiIcon: {
        fontSize: 80,
        marginBottom: spacing.md,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 10 },
        textShadowRadius: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: colors.white,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: 'rgba(255,255,255,0.8)',
        marginTop: spacing.sm,
        fontWeight: '500',
    },
    cardContainer: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 20,
    },
    glassCard: {
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    googleButton: {
        backgroundColor: colors.white,
    },
    googleButtonText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.text,
    },
    appleButton: {
        backgroundColor: '#000',
        marginTop: spacing.sm,
    },
    appleButtonText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: 'white',
    },
    guestButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    guestButtonText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.white,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: spacing.md,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    orText: {
        color: 'rgba(255,255,255,0.5)',
        marginHorizontal: spacing.md,
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
});
