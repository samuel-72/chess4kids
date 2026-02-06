import React from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../constants/theme';
import { Square, positionToSquare } from '../utils/chessLogic';

interface ChessBoardProps {
    highlightedSquares?: Square[];
    selectedSquare?: Square | null;
    rewardSquares?: Square[];
    collectedSquares?: Square[];
    onSquarePress?: (square: Square) => void;
    piecePosition?: Square;
    pieceSymbol?: string;
    showCoordinates?: boolean;
}

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 400);
const SQUARE_SIZE = BOARD_SIZE / 8;

export function ChessBoard({
    highlightedSquares = [],
    selectedSquare = null,
    rewardSquares = [],
    collectedSquares = [],
    onSquarePress,
    piecePosition,
    pieceSymbol = '♞',
    showCoordinates = true,
}: ChessBoardProps) {

    const renderSquare = (row: number, col: number) => {
        const isLight = (row + col) % 2 === 0;
        const square = positionToSquare({ row: 7 - row, col }); // Flip row for display
        const isHighlighted = highlightedSquares.includes(square);
        const isSelected = selectedSquare === square;
        const hasReward = rewardSquares.includes(square) && !collectedSquares.includes(square);
        const hasPiece = piecePosition === square;
        const isCollected = collectedSquares.includes(square);

        return (
            <Pressable
                key={`${row}-${col}`}
                style={[
                    styles.square,
                    {
                        backgroundColor: isSelected
                            ? colors.boardSelected
                            : isHighlighted
                                ? colors.boardHighlight
                                : isLight
                                    ? colors.boardLight
                                    : colors.boardDark,
                    },
                ]}
                onPress={() => onSquarePress?.(square)}
            >
                {/* Reward on this square */}
                {hasReward && (
                    <Animated.Text style={styles.reward}>🍫</Animated.Text>
                )}

                {/* Collected check mark */}
                {isCollected && (
                    <Animated.Text style={styles.collected}>✓</Animated.Text>
                )}

                {/* Chess piece */}
                {hasPiece && (
                    <Animated.Text style={styles.piece}>{pieceSymbol}</Animated.Text>
                )}

                {/* Coordinate labels */}
                {showCoordinates && row === 7 && (
                    <Animated.Text style={styles.colLabel}>
                        {String.fromCharCode('A'.charCodeAt(0) + col)}
                    </Animated.Text>
                )}
                {showCoordinates && col === 0 && (
                    <Animated.Text style={styles.rowLabel}>
                        {8 - row}
                    </Animated.Text>
                )}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.board}>
                {Array.from({ length: 8 }, (_, row) =>
                    Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: colors.primaryDark,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    square: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    piece: {
        fontSize: SQUARE_SIZE * 0.7,
        textAlign: 'center',
    },
    reward: {
        fontSize: SQUARE_SIZE * 0.5,
        position: 'absolute',
    },
    collected: {
        fontSize: SQUARE_SIZE * 0.4,
        color: colors.success,
        fontWeight: 'bold',
        position: 'absolute',
    },
    colLabel: {
        position: 'absolute',
        bottom: 2,
        right: 4,
        fontSize: 10,
        color: colors.textLight,
        fontWeight: '600',
    },
    rowLabel: {
        position: 'absolute',
        top: 2,
        left: 4,
        fontSize: 10,
        color: colors.textLight,
        fontWeight: '600',
    },
});
