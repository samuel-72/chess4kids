import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

const { height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LoginScreenProps {
    onNavigate: () => void;
}

export default function LoginScreen({ onNavigate }: LoginScreenProps) {
    const { loginAsGuest } = useAuthStore();

    // Animated chess pieces
    const knightY = useSharedValue(0);
    const queenRotate = useSharedValue(0);

    React.useEffect(() => {
        knightY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 1000 }),
                withTiming(0, { duration: 1000 })
            ),
            -1,
            true
        );
        queenRotate.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 2000 }),
                withTiming(5, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const knightStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: knightY.value }],
    }));

    const queenStyle = useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${queenRotate.value}deg` }],
    }));

    const handleGoogleLogin = () => {
        loginAsGuest();
        onNavigate();
    };

    const handleAppleLogin = () => {
        loginAsGuest();
        onNavigate();
    };

    const handleGuestLogin = () => {
        loginAsGuest();
        onNavigate();
    };

    return (
        <LinearGradient
            colors={[colors.primary, colors.primaryDark, '#2D1B69']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Animated decorative pieces */}
                <View style={styles.decorations}>
                    <Animated.Text style={[styles.decorPiece, styles.knight, knightStyle]}>
                        ♞
                    </Animated.Text>
                    <Animated.Text style={[styles.decorPiece, styles.queen, queenStyle]}>
                        ♛
                    </Animated.Text>
                    <Text style={[styles.decorPiece, styles.pawn]}>♟</Text>
                    <Text style={[styles.decorPiece, styles.rook]}>♜</Text>
                </View>

                {/* Logo and Title */}
                <View style={styles.header}>
                    <Text style={styles.logoEmoji}>♚</Text>
                    <Text style={styles.title}>Chess Kids</Text>
                    <Text style={styles.subtitle}>Learn Chess the Fun Way! 🎉</Text>
                </View>

                {/* Login buttons */}
                <View style={styles.buttonContainer}>
                    <LoginButton
                        onPress={handleGoogleLogin}
                        icon="🔵"
                        label="Continue with Google"
                        backgroundColor="#FFFFFF"
                        textColor="#333333"
                    />

                    <LoginButton
                        onPress={handleAppleLogin}
                        icon="🍎"
                        label="Continue with Apple"
                        backgroundColor="#000000"
                        textColor="#FFFFFF"
                    />

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <LoginButton
                        onPress={handleGuestLogin}
                        icon="🎮"
                        label="Play as Guest"
                        backgroundColor={colors.secondary}
                        textColor="#FFFFFF"
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Made with ❤️ for little champions
                    </Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

interface LoginButtonProps {
    onPress: () => void;
    icon: string;
    label: string;
    backgroundColor: string;
    textColor: string;
}

function LoginButton({ onPress, icon, label, backgroundColor, textColor }: LoginButtonProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[styles.button, { backgroundColor }, animatedStyle]}
            onPressIn={() => { scale.value = withSpring(0.95); }}
            onPressOut={() => { scale.value = withSpring(1); }}
            onPress={onPress}
        >
            <Text style={styles.buttonIcon}>{icon}</Text>
            <Text style={[styles.buttonLabel, { color: textColor }]}>{label}</Text>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xl,
    },
    decorations: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    decorPiece: {
        position: 'absolute',
        fontSize: 60,
        opacity: 0.15,
        color: '#FFFFFF',
    },
    knight: {
        top: '10%',
        right: '5%',
        fontSize: 80,
    },
    queen: {
        top: '25%',
        left: '5%',
        fontSize: 70,
    },
    pawn: {
        bottom: '20%',
        right: '10%',
        fontSize: 50,
    },
    rook: {
        bottom: '30%',
        left: '8%',
        fontSize: 55,
    },
    header: {
        alignItems: 'center',
        marginTop: height * 0.1,
    },
    logoEmoji: {
        fontSize: 80,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.giant,
        fontWeight: 'bold',
        color: colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: spacing.sm,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonIcon: {
        fontSize: fontSize.xl,
        marginRight: spacing.sm,
    },
    buttonLabel: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginHorizontal: spacing.md,
        fontSize: fontSize.sm,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: fontSize.sm,
    },
});
