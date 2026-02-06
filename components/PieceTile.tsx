import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, pieceSymbols, pieceEmojis, pieceNames } from '../constants/theme';
import { PieceType } from '../stores/progressStore';

interface PieceTileProps {
    piece: PieceType;
    completedLessons: number;
    totalLessons: number;
    onPress: () => void;
    isLocked?: boolean;
}

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - spacing.lg * 3) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const pieceGradients: Record<PieceType, readonly [string, string]> = {
    pawn: ['#FFE66D', '#FFA502'] as const,
    knight: ['#6C63FF', '#5147E5'] as const,
    bishop: ['#4ECDC4', '#44A08D'] as const,
    rook: ['#FF6B6B', '#EE5A24'] as const,
    queen: ['#A55EEA', '#8854D0'] as const,
    king: ['#FFD700', '#F79F1F'] as const,
};

export function PieceTile({
    piece,
    completedLessons,
    totalLessons,
    onPress,
    isLocked = false,
}: PieceTileProps) {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotateZ: `${rotation.value}deg` },
        ],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        rotation.value = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 100 }),
            withTiming(0, { duration: 50 })
        );
        onPress();
    };

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <AnimatedPressable
            style={[styles.container, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={isLocked}
        >
            <LinearGradient
                colors={isLocked ? ['#BDC3C7', '#95A5A6'] : pieceGradients[piece]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Emoji icon */}
                <Text style={styles.emoji}>{pieceEmojis[piece]}</Text>

                {/* Chess piece symbol */}
                <Text style={styles.pieceSymbol}>{pieceSymbols[piece]}</Text>

                {/* Piece name */}
                <Text style={styles.pieceName}>{pieceNames[piece]}</Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

                {/* Lessons count */}
                <Text style={styles.lessonsText}>
                    {completedLessons}/{totalLessons} lessons
                </Text>

                {/* Lock overlay */}
                {isLocked && (
                    <View style={styles.lockOverlay}>
                        <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                )}
            </LinearGradient>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: spacing.sm,
        borderRadius: borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    gradient: {
        flex: 1,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    emoji: {
        fontSize: fontSize.xxl,
        marginBottom: spacing.xs,
    },
    pieceSymbol: {
        fontSize: fontSize.giant,
        color: colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    pieceName: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.white,
        marginTop: spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    progressContainer: {
        width: '80%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.white,
        borderRadius: 4,
    },
    lessonsText: {
        fontSize: fontSize.xs,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: spacing.xs,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockIcon: {
        fontSize: fontSize.giant,
    },
});
