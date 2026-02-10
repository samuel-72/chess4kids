import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
    runOnJS,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Confetti Colors (vibrant, harmonious palette) ───
const CONFETTI_COLORS = [
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
    '#FF85B3', '#A66CFF', '#FF9F45', '#54D1DB',
    '#FF5E78', '#FFB347', '#7FE9DE', '#C78BFA',
];

// ─── Confetti shapes ───
type ConfettiShape = 'rect' | 'circle' | 'strip';

interface ConfettiPiece {
    id: number;
    color: string;
    shape: ConfettiShape;
    startX: number;
    delay: number;           // stagger start
    speed: number;           // fall duration
    amplitude: number;       // horizontal sway
    rotateSpeed: number;
    size: number;
}

interface StarBurst {
    id: number;
    angle: number;
    distance: number;
    delay: number;
    size: number;
}

// ─── Confetti Piece Component ───
const ConfettiPieceView = React.memo(({ piece }: { piece: ConfettiPiece }) => {
    const progress = useSharedValue(0);
    const swayPhase = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            piece.delay,
            withTiming(1, { duration: piece.speed, easing: Easing.linear })
        );
        swayPhase.value = withDelay(
            piece.delay,
            withRepeat(
                withTiming(1, { duration: 800 + Math.random() * 400, easing: Easing.inOut(Easing.sin) }),
                -1,
                true
            )
        );
    }, []);

    const style = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [-80, SH + 40]);
        const translateX = piece.amplitude * Math.sin(swayPhase.value * Math.PI * 2);
        const rotate = `${interpolate(progress.value, [0, 1], [0, piece.rotateSpeed * 720])}deg`;
        const opacity = interpolate(progress.value, [0, 0.05, 0.85, 1], [0, 1, 1, 0]);
        const scaleX = interpolate(
            swayPhase.value,
            [0, 0.5, 1],
            [1, 0.3, 1]  // flutter effect — piece appears to turn in 3D
        );

        return {
            transform: [{ translateX }, { translateY }, { rotate }, { scaleX }],
            opacity,
        };
    });

    const shapeStyle = useMemo(() => {
        const base = { width: piece.size, height: piece.size, backgroundColor: piece.color };
        switch (piece.shape) {
            case 'circle':
                return { ...base, borderRadius: piece.size / 2 };
            case 'strip':
                return { ...base, width: piece.size * 0.4, height: piece.size * 1.8, borderRadius: 2 };
            case 'rect':
            default:
                return { ...base, borderRadius: 2 };
        }
    }, [piece]);

    return (
        <Animated.View
            style={[
                { position: 'absolute', left: piece.startX },
                style,
            ]}
        >
            <View style={shapeStyle} />
        </Animated.View>
    );
});

// ─── Star Burst Component (radiating stars from center) ───
const StarBurstView = React.memo(({ star }: { star: StarBurst }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            star.delay,
            withSequence(
                withSpring(1, { damping: 8, stiffness: 120 }),
                withDelay(300, withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }))
            )
        );
    }, []);

    const style = useAnimatedStyle(() => {
        const distance = interpolate(progress.value, [0, 1], [0, star.distance]);
        const translateX = Math.cos(star.angle) * distance;
        const translateY = Math.sin(star.angle) * distance;
        const scale = interpolate(progress.value, [0, 0.5, 1], [0, 1.2, 0.8]);
        const rotation = `${interpolate(progress.value, [0, 1], [0, 180])}deg`;

        return {
            transform: [{ translateX }, { translateY }, { scale }, { rotate: rotation }],
            opacity: progress.value,
        };
    });

    return (
        <Animated.Text
            style={[
                {
                    position: 'absolute',
                    fontSize: star.size,
                    left: SW / 2 - star.size / 2,
                    top: SH / 2 - star.size / 2,
                },
                style,
            ]}
        >
            ✦
        </Animated.Text>
    );
});

// ─── Ring Shockwave Component ───
const RingShockwave = () => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withTiming(3, { duration: 800, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) });
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: SW / 2 - 60,
                    top: SH / 2 - 60,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: '#FFD700',
                },
                style,
            ]}
        />
    );
};

// ─── Second Ring (delayed) ───
const RingShockwave2 = () => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withDelay(150, withTiming(2.5, { duration: 700, easing: Easing.out(Easing.quad) }));
        opacity.value = withDelay(150, withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: SW / 2 - 40,
                    top: SH / 2 - 40,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 215, 0, 0.6)',
                },
                style,
            ]}
        />
    );
};

// ─── Message Card Component ───
const MessageCard = ({ message }: { message: string }) => {
    const scale = useSharedValue(0);
    const glow = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            300,
            withSpring(1, { damping: 6, stiffness: 100, mass: 0.8 })
        );
        glow.value = withDelay(
            600,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            )
        );
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: interpolate(scale.value, [0, 0.5, 1], [0, 0.8, 1]),
    }));

    const glowStyle = useAnimatedStyle(() => ({
        shadowOpacity: interpolate(glow.value, [0, 1], [0.3, 0.8]),
        shadowRadius: interpolate(glow.value, [0, 1], [12, 28]),
    }));

    return (
        <Animated.View style={[styles.messageContainer, cardStyle, glowStyle]}>
            <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
    );
};

// ─── Main Celebration Overlay ───
interface CelebrationProps {
    visible: boolean;
    message?: string;
    onComplete?: () => void;
}

export default function CelebrationOverlay({
    visible,
    message = '🎉 Amazing!',
    onComplete,
}: CelebrationProps) {
    const overlayOpacity = useSharedValue(0);

    // Generate confetti pieces
    const confetti = useMemo(() => {
        if (!visible) return [];
        const pieces: ConfettiPiece[] = [];
        const shapes: ConfettiShape[] = ['rect', 'circle', 'strip'];
        for (let i = 0; i < 60; i++) {
            pieces.push({
                id: i,
                color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                startX: Math.random() * SW,
                delay: Math.random() * 600,
                speed: 2200 + Math.random() * 1800,
                amplitude: 20 + Math.random() * 40,
                rotateSpeed: 1 + Math.random() * 3,
                size: 6 + Math.random() * 10,
            });
        }
        return pieces;
    }, [visible]);

    // Generate star bursts
    const stars = useMemo(() => {
        if (!visible) return [];
        const s: StarBurst[] = [];
        for (let i = 0; i < 16; i++) {
            s.push({
                id: i,
                angle: (Math.PI * 2 * i) / 16 + (Math.random() * 0.3 - 0.15),
                distance: 80 + Math.random() * 100,
                delay: i * 40,
                size: 16 + Math.random() * 16,
            });
        }
        return s;
    }, [visible]);

    useEffect(() => {
        if (visible) {
            overlayOpacity.value = withTiming(1, { duration: 200 });
        } else {
            overlayOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
                if (finished && onComplete) {
                    runOnJS(onComplete)();
                }
            });
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
        pointerEvents: overlayOpacity.value > 0.1 ? 'auto' as const : 'none' as const,
    }));

    if (!visible && confetti.length === 0) return null;

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            {/* Ring shockwaves from center */}
            <RingShockwave />
            <RingShockwave2 />

            {/* Star burst from center */}
            {stars.map((star) => (
                <StarBurstView key={star.id} star={star} />
            ))}

            {/* Confetti rain */}
            {confetti.map((piece) => (
                <ConfettiPieceView key={piece.id} piece={piece} />
            ))}

            {/* Center message card */}
            <MessageCard message={message} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    messageContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 44,
        paddingVertical: 28,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    messageText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#6B4EE6',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
