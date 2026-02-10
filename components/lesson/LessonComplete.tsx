import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
    withRepeat,
    Easing,
    interpolate,
    FadeIn,
    SlideInDown,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Sparkle particle ───
interface Sparkle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

const SparkleView = React.memo(({ sparkle }: { sparkle: Sparkle }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(
            sparkle.delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: sparkle.duration * 0.4, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: sparkle.duration * 0.6, easing: Easing.in(Easing.quad) })
                ),
                -1,
                false
            )
        );
        scale.value = withDelay(
            sparkle.delay,
            withRepeat(
                withSequence(
                    withSpring(1.2, { damping: 4, stiffness: 90 }),
                    withTiming(0, { duration: sparkle.duration * 0.5 })
                ),
                -1,
                false
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.Text
            style={[
                {
                    position: 'absolute',
                    left: sparkle.x,
                    top: sparkle.y,
                    fontSize: sparkle.size,
                    color: '#FFD700',
                },
                style,
            ]}
        >
            ✦
        </Animated.Text>
    );
});

// ─── Animated Star Rating ───
const StarRating = ({ stars }: { stars: number }) => {
    return (
        <View style={starStyles.container}>
            {[1, 2, 3].map((i) => (
                <AnimatedStar key={i} index={i} filled={i <= stars} />
            ))}
        </View>
    );
};

const AnimatedStar = ({ index, filled }: { index: number; filled: boolean }) => {
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            600 + index * 250,
            withSequence(
                withSpring(1.4, { damping: 4, stiffness: 120 }),
                withSpring(1, { damping: 8, stiffness: 100 })
            )
        );
        rotate.value = withDelay(
            600 + index * 250,
            withSequence(
                withTiming(-0.2, { duration: 100 }),
                withSpring(0, { damping: 6, stiffness: 80 })
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}rad` },
        ],
    }));

    return (
        <Animated.Text style={[starStyles.star, style]}>
            {filled ? '⭐' : '☆'}
        </Animated.Text>
    );
};

const starStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 16,
    },
    star: {
        fontSize: 48,
    },
});

// ─── Floating confetti piece ───
const FloatingConfetti = React.memo(({ color, startX, delay }: { color: string; startX: number; delay: number }) => {
    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(delay, withRepeat(
            withTiming(SH + 40, { duration: 4000 + Math.random() * 3000, easing: Easing.linear }),
            -1, false
        ));
        translateX.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(30, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                withTiming(-30, { duration: 1500, easing: Easing.inOut(Easing.sin) })
            ),
            -1, true
        ));
        rotate.value = withDelay(delay, withRepeat(
            withTiming(360, { duration: 2000 + Math.random() * 2000, easing: Easing.linear }),
            -1, false
        ));
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: startX,
                    top: -20,
                    width: 8,
                    height: 8,
                    backgroundColor: color,
                    borderRadius: 2,
                },
                style,
            ]}
        />
    );
});

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF85B3', '#A66CFF', '#FF9F45'];

// ─── Main Component ───
interface LessonCompleteProps {
    reward: { emoji: string; name: string; image?: any };
    score?: number;       // 1-3 stars
    onBack: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
    reward,
    score = 3,
    onBack,
}) => {
    // ... hooks ...
    const rewardScale = useSharedValue(0);
    const rewardRotate = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(30);
    const subtitleOpacity = useSharedValue(0);
    const buttonScale = useSharedValue(0);
    const glowScale = useSharedValue(0.8);

    // ... sparkles and confetti hooks ...
    // Sparkles
    const sparkles = useMemo<Sparkle[]>(() => {
        const s: Sparkle[] = [];
        for (let i = 0; i < 20; i++) {
            s.push({
                id: i,
                x: Math.random() * SW,
                y: Math.random() * SH,
                size: 10 + Math.random() * 18,
                delay: Math.random() * 3000,
                duration: 1500 + Math.random() * 2000,
            });
        }
        return s;
    }, []);

    // Background confetti
    const confettiPieces = useMemo(() => {
        return Array.from({ length: 25 }, (_, i) => ({
            id: i,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            startX: Math.random() * SW,
            delay: Math.random() * 2000,
        }));
    }, []);

    useEffect(() => {
        // Phase 1: Reward drops in with bounce (0ms)
        rewardScale.value = withSpring(1, { damping: 5, stiffness: 80, mass: 1.2 });
        rewardRotate.value = withSequence(
            withTiming(-0.15, { duration: 150 }),
            withSpring(0, { damping: 4, stiffness: 60 })
        );

        // Phase 2: Pulsing glow behind reward
        glowScale.value = withDelay(400, withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.sin) })
            ),
            -1, true
        ));

        // Phase 3: Title slides up (500ms)
        titleOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
        titleTranslateY.value = withDelay(500, withSpring(0, { damping: 10, stiffness: 100 }));

        // Phase 4: Subtitle fades in (900ms)
        subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));

        // Phase 5: Button bounces in (1300ms)
        buttonScale.value = withDelay(1300, withSpring(1, { damping: 6, stiffness: 90 }));
    }, []);

    const rewardStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: rewardScale.value },
            { rotate: `${rewardRotate.value}rad` },
        ],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: interpolate(glowScale.value, [0.85, 1.1], [0.3, 0.7]),
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    const subtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    return (
        <LinearGradient
            colors={['#1a0533', '#2d1b69', '#4B0082', '#6B4EE6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Background sparkles */}
            {sparkles.map((s) => (
                <SparkleView key={s.id} sparkle={s} />
            ))}

            {/* Background confetti */}
            {confettiPieces.map((c) => (
                <FloatingConfetti key={c.id} color={c.color} startX={c.startX} delay={c.delay} />
            ))}

            <SafeAreaView style={styles.safeArea}>
                {/* Glowing orb behind reward */}
                <Animated.View style={[styles.glowOrb, glowStyle]} />

                {/* Reward Image or Emoji */}
                <Animated.View style={rewardStyle}>
                    {reward.image ? (
                        <Image
                            source={reward.image}
                            style={{ width: 180, height: 180 }}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                    )}
                </Animated.View>

                {/* Star rating */}
                <StarRating stars={score} />

                {/* Title */}
                <Animated.View style={titleStyle}>
                    <Text style={styles.title}>Lesson Complete!</Text>
                </Animated.View>

                {/* Subtitle */}
                <Animated.View style={subtitleStyle}>
                    <Text style={styles.subtitle}>You earned a {reward.name}</Text>
                </Animated.View>

                {/* Back button */}
                <AnimatedPressable
                    style={[styles.button, buttonStyle]}
                    onPress={onBack}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>🏠 Back to Home</Text>
                    </LinearGradient>
                </AnimatedPressable>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    glowOrb: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FFD700',
        top: SH * 0.25,
    },
    rewardEmoji: {
        fontSize: 120,
        textShadowColor: 'rgba(255, 215, 0, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.white,
        textShadowColor: 'rgba(107, 78, 230, 0.8)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
        letterSpacing: 1,
        marginTop: 8,
    },
    subtitle: {
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: spacing.sm,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    button: {
        marginTop: spacing.xl + 8,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    buttonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: borderRadius.lg,
    },
    buttonText: {
        color: '#1a0533',
        fontWeight: '800',
        fontSize: 20,
        letterSpacing: 0.5,
    },
});
