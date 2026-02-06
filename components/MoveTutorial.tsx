import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { PieceType } from '../stores/progressStore';
import { colors, borderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const TUTORIAL_SIZE = 120;
const SQUARE_SIZE = TUTORIAL_SIZE / 4;

const MOVES: Record<PieceType, { x: number; y: number }[]> = {
    pawn: [{ x: 0, y: -1 }],
    knight: [{ x: 1, y: -2 }],
    bishop: [{ x: 2, y: -2 }], // Diagonal
    rook: [{ x: 2, y: 0 }], // Horizontal
    queen: [{ x: 2, y: -2 }], // Diagonal like bishop
    king: [{ x: 1, y: -1 }]
};

export function MoveTutorial({ piece }: { piece: PieceType }) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const move = MOVES[piece][0];
        const duration = 1500;

        translateX.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }), // Start
                withTiming(move.x * SQUARE_SIZE, { duration, easing: Easing.inOut(Easing.quad) }), // Move
                withTiming(move.x * SQUARE_SIZE, { duration: 500 }), // Pause
                withTiming(0, { duration: 0 }) // Reset
            ),
            -1
        );

        translateY.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }),
                withTiming(move.y * SQUARE_SIZE, { duration, easing: Easing.inOut(Easing.quad) }),
                withTiming(move.y * SQUARE_SIZE, { duration: 500 }),
                withTiming(0, { duration: 0 })
            ),
            -1
        );

        // Fade trail
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 0 }),
                withTiming(1, { duration }),
                withTiming(0, { duration: 200 }),
                withTiming(0, { duration: 300 }),
                withTiming(1, { duration: 0 })
            ),
            -1
        );

        return () => {
            cancelAnimation(translateX);
            cancelAnimation(translateY);
        }
    }, [piece]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value }
        ],
        opacity: opacity.value
    }));

    return (
        <View style={styles.container}>
            <View style={styles.board}>
                {[...Array(16)].map((_, i) => {
                    const row = Math.floor(i / 4);
                    const col = i % 4;
                    const isLight = (row + col) % 2 === 0;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.square,
                                isLight ? styles.light : styles.dark
                            ]}
                        />
                    );
                })}

                {/* Center Start Point */}
                <View style={[styles.pieceMarker, { top: SQUARE_SIZE * 2, left: SQUARE_SIZE }]} />

                {/* Animated Piece */}
                <Animated.View style={[styles.movingPiece, { top: SQUARE_SIZE * 2, left: SQUARE_SIZE }, animatedStyle]}>
                    <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.pieceGradient} />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: TUTORIAL_SIZE,
        height: TUTORIAL_SIZE,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.white,
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    square: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
    },
    light: { backgroundColor: '#F0D9B5' },
    dark: { backgroundColor: '#B58863' },
    pieceMarker: {
        position: 'absolute',
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    movingPiece: {
        position: 'absolute',
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        padding: 4,
    },
    pieceGradient: {
        flex: 1,
        borderRadius: SQUARE_SIZE / 2,
        borderWidth: 2,
        borderColor: 'white',
    }
});
