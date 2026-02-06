import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { colors, fontSize } from '../constants/theme';

interface RewardAnimationProps {
    type: 'chocolate' | 'star' | 'cookie' | 'candy' | 'success' | 'error';
    visible: boolean;
    onComplete?: () => void;
}

const rewardEmojis: Record<string, string> = {
    chocolate: '🍫',
    star: '⭐',
    cookie: '🍪',
    candy: '🍬',
    success: '🎉',
    error: '❌',
};

const { width, height } = Dimensions.get('window');

export function RewardAnimation({ type, visible, onComplete }: RewardAnimationProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Entry animation
            scale.value = withSequence(
                withSpring(1.5, { damping: 6, stiffness: 200 }),
                withSpring(1, { damping: 10 })
            );
            opacity.value = withTiming(1, { duration: 200 });
            rotation.value = withSequence(
                withTiming(-15, { duration: 100 }),
                withTiming(15, { duration: 200 }),
                withTiming(0, { duration: 100 })
            );

            // Exit animation
            translateY.value = withDelay(
                1000,
                withTiming(-100, { duration: 500 }, (finished) => {
                    if (finished && onComplete) {
                        runOnJS(onComplete)();
                    }
                })
            );
            opacity.value = withDelay(1000, withTiming(0, { duration: 500 }));
        } else {
            scale.value = 0;
            opacity.value = 0;
            translateY.value = 0;
            rotation.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
            { rotateZ: `${rotation.value}deg` },
        ],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[styles.rewardContainer, animatedStyle]}>
                <Text style={styles.emoji}>{rewardEmojis[type]}</Text>
                {type !== 'error' && (
                    <Text style={styles.text}>
                        {type === 'success' ? 'Great Job!' : '+10 XP'}
                    </Text>
                )}
                {type === 'error' && (
                    <Text style={[styles.text, styles.errorText]}>Try Again!</Text>
                )}
            </Animated.View>
        </View>
    );
}

export function ConfettiAnimation({ visible }: { visible: boolean }) {
    const confettiItems = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * width,
        delay: Math.random() * 500,
        rotation: Math.random() * 360,
        color: ['#FFE66D', '#FF6B6B', '#4ECDC4', '#6C63FF', '#A55EEA'][Math.floor(Math.random() * 5)],
    }));

    if (!visible) return null;

    return (
        <View style={styles.confettiContainer} pointerEvents="none">
            {confettiItems.map((item) => (
                <ConfettiPiece key={item.id} {...item} />
            ))}
        </View>
    );
}

function ConfettiPiece({ left, delay, rotation, color }: {
    left: number;
    delay: number;
    rotation: number;
    color: string;
}) {
    const translateY = useSharedValue(-50);
    const rotate = useSharedValue(rotation);
    const opacity = useSharedValue(1);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withTiming(height + 50, { duration: 2000 })
        );
        rotate.value = withDelay(
            delay,
            withTiming(rotation + 720, { duration: 2000 })
        );
        opacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { rotateZ: `${rotate.value}deg` },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                { left, backgroundColor: color },
                animatedStyle,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    rewardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    emoji: {
        fontSize: 64,
    },
    text: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.success,
        marginTop: 8,
    },
    errorText: {
        color: colors.error,
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    confettiPiece: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});
