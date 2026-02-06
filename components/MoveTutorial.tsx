import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { PieceType } from '../stores/progressStore';
import { colors, borderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CELL_SIZE = 40;
const GRID_SIZE = 5;
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

// Piece Emojis (matching the lesson screen)
const PIECE_EMOJIS: Record<PieceType, string> = {
    pawn: '♟',
    knight: '♞',
    bishop: '♝',
    rook: '♜',
    queen: '♛',
    king: '♚',
};

// Define moves for the demo (start center)
// Grid is 0..4. Center is 2,2.
const CENTER = 2; // (2, 2)

const DEMO_MOVES: Record<PieceType, { dx: number; dy: number; label?: string }[]> = {
    pawn: [{ dx: 0, dy: -1 }], // Up 1
    knight: [{ dx: 1, dy: -2 }], // L-shape (Right 1, Up 2)
    bishop: [{ dx: 2, dy: -2 }], // Diag Up-Right 2
    rook: [{ dx: 2, dy: 0 }],  // Right 2
    queen: [{ dx: -2, dy: -2 }], // Diag Up-Left 2
    king: [{ dx: 1, dy: 0 }],   // Right 1
};

const Arrow = ({ start, end }: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
    // Calculate geometry
    const dx = (end.x - start.x) * CELL_SIZE;
    const dy = (end.y - start.y) * CELL_SIZE;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Degrees

    // Adjust length slightly so arrow head doesn't overlap center too much
    const arrowLength = Math.max(0, distance - 15);

    return (
        <View
            style={{
                position: 'absolute',
                left: start.x * CELL_SIZE + CELL_SIZE / 2,
                top: start.y * CELL_SIZE + CELL_SIZE / 2,
                width: distance, // Full distance container
                height: 1, // Minimal height
                transform: [
                    { translateX: -distance / 2 }, // Center origin fix (React Native transform origin is center)
                    { translateY: 0 },
                    { rotate: `${angle}deg` },
                    { translateX: distance / 2 }, // Push back
                ],
                alignItems: 'center', // Align arrow line vertically
                flexDirection: 'row',
                zIndex: 10,
            }}
        >
            {/* The Line */}
            <View style={{
                width: arrowLength,
                height: 6,
                backgroundColor: 'rgba(255, 170, 0, 0.6)',
                borderRadius: 3,
            }} />

            {/* The Arrow Head */}
            <View style={{
                marginLeft: -8, // Slight overlap
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 10,
                borderRightWidth: 0,
                borderBottomWidth: 8,
                borderTopWidth: 8,
                borderLeftColor: 'rgba(255, 170, 0, 0.8)', // Arrow color
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                borderTopColor: 'transparent',
            }} />
        </View>
    );
};

export function MoveTutorial({ piece }: { piece: PieceType }) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0); // Piece starts invisible

    // Movement definition
    const move = DEMO_MOVES[piece]?.[0] || { dx: 0, dy: 0 };
    const startPos = { x: CENTER, y: CENTER };
    const endPos = { x: CENTER + move.dx, y: CENTER + move.dy };

    useEffect(() => {
        const loopDuration = 2500;

        // Piece Animation Loop
        translateX.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }), // Reset
                withDelay(200, withTiming(move.dx * CELL_SIZE, { duration: 1000, easing: Easing.inOut(Easing.cubic) })), // Move
                withTiming(move.dx * CELL_SIZE, { duration: 1000 }), // Wait at end
                withTiming(0, { duration: 0 }) // Instant reset
            ),
            -1
        );

        translateY.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }),
                withDelay(200, withTiming(move.dy * CELL_SIZE, { duration: 1000, easing: Easing.inOut(Easing.cubic) })),
                withTiming(move.dy * CELL_SIZE, { duration: 1000 }),
                withTiming(0, { duration: 0 })
            ),
            -1
        );

        // Opacity/Visibility Loop
        opacity.value = 1; // Always visible for now, maybe pulse?

        return () => {
            cancelAnimation(translateX);
            cancelAnimation(translateY);
        }
    }, [piece, move]);

    const animatedPieceStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value }
        ]
    }));

    // Grid Rendering
    const squares = useMemo(() => {
        const grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const isLight = (row + col) % 2 === 0;
                grid.push(
                    <View
                        key={`${row}-${col}`}
                        style={[
                            styles.square,
                            isLight ? styles.light : styles.dark
                        ]}
                    />
                );
            }
        }
        return grid;
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.board}>
                {squares}

                {/* Visual Arrow (Static path indicator) */}
                <Arrow start={startPos} end={endPos} />

                {/* Target Highlight (Dot) */}
                <View style={[styles.targetMarker, {
                    left: endPos.x * CELL_SIZE,
                    top: endPos.y * CELL_SIZE
                }]} />

                {/* The Piece */}
                <View style={[styles.pieceContainer, {
                    left: startPos.x * CELL_SIZE,
                    top: startPos.y * CELL_SIZE,
                }]}>
                    <Animated.Text style={[styles.pieceEmoji, animatedPieceStyle]}>
                        {PIECE_EMOJIS[piece]}
                    </Animated.Text>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: BOARD_SIZE + 4, // Border width included
        height: BOARD_SIZE + 4,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4a4a4a', // Darker border
        backgroundColor: '#333',
        elevation: 10,
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: BOARD_SIZE,
        height: BOARD_SIZE,
    },
    square: {
        width: CELL_SIZE,
        height: CELL_SIZE,
    },
    light: { backgroundColor: '#EEEED2' }, // Classic chess colors
    dark: { backgroundColor: '#769656' },

    pieceContainer: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20, // Above arrow
    },
    pieceEmoji: {
        fontSize: 32,
        // No text shadow for cleaner look or maybe slight
    },

    targetMarker: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 0, 0.2)', // Subtle green highlight
        zIndex: 5,
    },
});
