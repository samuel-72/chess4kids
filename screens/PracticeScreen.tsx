import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getValidMoves, Position, positionToSquare, squareToPosition } from '../utils/chessLogic';
import { PieceType } from '../stores/progressStore';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { SoundEffects } from '../utils/soundEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 360);
const SQUARE_SIZE = BOARD_SIZE / 8;

// Fun reward emojis
const REWARD_EMOJIS = [
    '🍫', '🍬', '🍭', '🧁', '🍪', // Sweets
    '🦕', '🦖', '🦄', '🐴', '🐎', // Animals
    '🐕', '🐶', '🐱', '🐈', '🐰', // Pets
    '⭐', '🌟', '✨', '🎉', '🎊', // Celebration
    '🌈', '💎', '👑', '🏆', '🎁', // Rewards
];

interface PracticeScreenProps {
    piece: PieceType;
    onBack: () => void;
    onComplete?: () => void;
}

interface RewardParticle {
    id: number;
    emoji: string;
    x: number;
    y: number;
    animation: Animated.Value;
    scale: Animated.Value;
}

export default function PracticeScreen({ piece, onBack, onComplete }: PracticeScreenProps) {
    // Knight starts in a good position for practice
    const [knightPosition, setKnightPosition] = useState<Position>({ row: 4, col: 4 });
    const [targetPosition, setTargetPosition] = useState<Position>({ row: 6, col: 5 });
    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const [rewardParticles, setRewardParticles] = useState<RewardParticle[]>([]);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'hint' | 'error'>('hint');

    // Calculate valid moves whenever knight position changes
    useEffect(() => {
        const square = positionToSquare(knightPosition);
        const moves = getValidMoves('knight', square);
        setValidMoves(moves);
    }, [knightPosition]);

    // Generate a new target position
    const generateNewTarget = useCallback(() => {
        const square = positionToSquare(knightPosition);
        const moves = getValidMoves('knight', square);
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const newTarget = squareToPosition(randomMove);
            setTargetPosition(newTarget);
        }
    }, [knightPosition]);

    // Initialize target
    useEffect(() => {
        generateNewTarget();
    }, []);

    // Spawn reward particles
    const spawnRewards = (x: number, y: number) => {
        const newParticles: RewardParticle[] = [];
        const numParticles = 8 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numParticles; i++) {
            const particle: RewardParticle = {
                id: Date.now() + i,
                emoji: REWARD_EMOJIS[Math.floor(Math.random() * REWARD_EMOJIS.length)],
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100,
                animation: new Animated.Value(0),
                scale: new Animated.Value(0),
            };
            newParticles.push(particle);
        }

        setRewardParticles(prev => [...prev, ...newParticles]);

        // Animate particles
        newParticles.forEach((particle, index) => {
            Animated.sequence([
                Animated.delay(index * 50),
                Animated.parallel([
                    Animated.spring(particle.scale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.animation, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => {
                // Remove particle after animation
                setRewardParticles(prev => prev.filter(p => p.id !== particle.id));
            });
        });
    };

    // Handle square tap
    const handleSquareTap = (row: number, col: number) => {
        const targetSquare = positionToSquare({ row, col });

        // Check if this is a valid move
        if (validMoves.includes(targetSquare)) {
            // Move the knight
            setKnightPosition({ row, col });

            // Check if we hit the target
            if (row === targetPosition.row && col === targetPosition.col) {
                // SUCCESS! 🎉
                setScore(prev => prev + 10 * level);
                setShowCelebration(true);
                setMessage('Amazing! 🎉');
                setMessageType('success');

                // Play celebration sound
                SoundEffects.celebrate();

                // Spawn rewards at target position
                const rewardX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
                const rewardY = (7 - row) * SQUARE_SIZE + SQUARE_SIZE / 2;
                spawnRewards(rewardX, rewardY);

                // Generate new target after a short delay
                setTimeout(() => {
                    setShowCelebration(false);
                    setLevel(prev => prev + 1);
                    generateNewTarget();
                    setMessage('');
                }, 1500);
            } else {
                setMessage('Good move! 👍');
                setMessageType('hint');
                SoundEffects.move();
                // Generate new target from new position
                setTimeout(() => {
                    generateNewTarget();
                    setMessage('');
                }, 500);
            }
        } else {
            // Invalid move
            setMessage('Knights move in an L-shape! ♞');
            setMessageType('error');
            SoundEffects.error();
            setTimeout(() => setMessage(''), 2000);
        }
    };

    // Render a single square
    const renderSquare = (row: number, col: number) => {
        const isLight = (row + col) % 2 === 1;
        const squareName = positionToSquare({ row, col });
        const isValidMove = validMoves.includes(squareName);
        const isKnightHere = knightPosition.row === row && knightPosition.col === col;
        const isTarget = targetPosition.row === row && targetPosition.col === col;

        return (
            <Pressable
                key={`${row}-${col}`}
                style={({ pressed }) => [
                    styles.square,
                    isLight ? styles.lightSquare : styles.darkSquare,
                    isValidMove && styles.validMoveSquare,
                    isTarget && styles.targetSquare,
                    pressed && styles.pressedSquare,
                ]}
                onPress={() => handleSquareTap(row, col)}
            >
                {isKnightHere && (
                    <Text style={styles.pieceEmoji}>♞</Text>
                )}
                {isTarget && !isKnightHere && (
                    <Text style={styles.targetEmoji}>
                        {REWARD_EMOJIS[level % REWARD_EMOJIS.length]}
                    </Text>
                )}
                {isValidMove && !isKnightHere && !isTarget && (
                    <View style={styles.validMoveIndicator} />
                )}
            </Pressable>
        );
    };

    return (
        <LinearGradient
            colors={['#FF9800', colors.primaryDark]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </Pressable>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Score</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                    </View>
                    <View style={styles.levelContainer}>
                        <Text style={styles.levelLabel}>Level</Text>
                        <Text style={styles.levelValue}>{level}</Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>♞ Knight Practice</Text>
                    <Text style={styles.instructionsText}>
                        Move the Knight to collect the treats!
                    </Text>
                </View>

                {/* Message */}
                {message ? (
                    <View style={[
                        styles.messageContainer,
                        messageType === 'success' && styles.successMessage,
                        messageType === 'error' && styles.errorMessage,
                    ]}>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                ) : null}

                {/* Chess Board */}
                <View style={styles.boardContainer}>
                    <View style={styles.board}>
                        {/* Render board rows from top (row 7) to bottom (row 0) */}
                        {[...Array(8)].map((_, rowFromTop) => {
                            const row = 7 - rowFromTop;
                            return (
                                <View key={row} style={styles.boardRow}>
                                    {[...Array(8)].map((_, col) => renderSquare(row, col))}
                                </View>
                            );
                        })}
                    </View>

                    {/* Reward particles */}
                    {rewardParticles.map(particle => (
                        <Animated.Text
                            key={particle.id}
                            style={[
                                styles.rewardParticle,
                                {
                                    left: particle.x,
                                    top: particle.y,
                                    opacity: particle.animation.interpolate({
                                        inputRange: [0, 0.3, 1],
                                        outputRange: [0, 1, 0],
                                    }),
                                    transform: [
                                        { scale: particle.scale },
                                        {
                                            translateY: particle.animation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -150],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            {particle.emoji}
                        </Animated.Text>
                    ))}
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: 'rgba(76, 175, 80, 0.5)' }]} />
                        <Text style={styles.legendText}>Valid moves</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
                        <Text style={styles.legendText}>Target</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Celebration Overlay */}
            <CelebrationOverlay
                visible={showCelebration}
                message="You got it! 🌟"
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    backButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    scoreContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    scoreLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: fontSize.xs,
    },
    scoreValue: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    levelContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    levelLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: fontSize.xs,
    },
    levelValue: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    instructionsContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    instructionsTitle: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        marginBottom: spacing.xs,
    },
    instructionsText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: fontSize.md,
        textAlign: 'center',
    },
    messageContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        alignSelf: 'center',
        marginBottom: spacing.sm,
    },
    successMessage: {
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
    },
    errorMessage: {
        backgroundColor: 'rgba(244, 67, 54, 0.6)',
    },
    messageText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    boardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    boardRow: {
        flexDirection: 'row',
    },
    square: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightSquare: {
        backgroundColor: '#F0D9B5',
    },
    darkSquare: {
        backgroundColor: '#B58863',
    },
    validMoveSquare: {
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
    },
    targetSquare: {
        backgroundColor: '#FFD700',
    },
    pressedSquare: {
        opacity: 0.7,
    },
    pieceEmoji: {
        fontSize: SQUARE_SIZE * 0.7,
    },
    targetEmoji: {
        fontSize: SQUARE_SIZE * 0.6,
    },
    validMoveIndicator: {
        width: SQUARE_SIZE * 0.3,
        height: SQUARE_SIZE * 0.3,
        borderRadius: SQUARE_SIZE * 0.15,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    rewardParticle: {
        position: 'absolute',
        fontSize: 32,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
        marginTop: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    legendText: {
        color: colors.white,
        fontSize: fontSize.sm,
    },
});
