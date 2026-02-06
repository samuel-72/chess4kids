import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PieceType, useProgressStore } from '../stores/progressStore';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { SoundEffects } from '../utils/soundEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 360);
const SQUARE_SIZE = BOARD_SIZE / 8;

// Fun surprise rewards when completing a lesson
const SURPRISE_REWARDS = [
    { emoji: '🍫', name: 'Chocolate Bar!' },
    { emoji: '🦄', name: 'Magical Unicorn!' },
    { emoji: '🦕', name: 'Friendly Dinosaur!' },
    { emoji: '🐶', name: 'Cute Puppy!' },
    { emoji: '🐱', name: 'Adorable Kitten!' },
    { emoji: '🎁', name: 'Mystery Gift!' },
    { emoji: '👑', name: 'Golden Crown!' },
    { emoji: '💎', name: 'Shiny Diamond!' },
    { emoji: '🌈', name: 'Rainbow!' },
    { emoji: '🍭', name: 'Sweet Lollipop!' },
];

interface PracticeScreenProps {
    piece: PieceType;
    onBack: () => void;
    onComplete?: () => void;
}

export default function PracticeScreen({ piece, onBack, onComplete }: PracticeScreenProps) {
    // Knight starts in a random position for variety
    const getRandomPosition = (): Position => ({
        row: 2 + Math.floor(Math.random() * 4), // rows 2-5
        col: 2 + Math.floor(Math.random() * 4), // cols 2-5
    });

    const [knightPosition, setKnightPosition] = useState<Position>(getRandomPosition);
    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [foundMoves, setFoundMoves] = useState<Set<string>>(new Set());
    const [wrongGuesses, setWrongGuesses] = useState<Set<string>>(new Set());
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lessonComplete, setLessonComplete] = useState(false);
    const [surpriseReward, setSurpriseReward] = useState(SURPRISE_REWARDS[0]);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'hint' | 'error'>('hint');
    const startTime = useRef(Date.now());

    const completeLesson = useProgressStore(state => state.completeLesson);

    // Calculate valid moves whenever knight position changes
    useEffect(() => {
        const square = positionToSquare(knightPosition);
        const moves = getValidMoves('knight', square);
        setValidMoves(moves);
        setFoundMoves(new Set());
        setWrongGuesses(new Set());
    }, [knightPosition]);

    // Check if all moves found
    useEffect(() => {
        if (validMoves.length > 0 && foundMoves.size === validMoves.length) {
            // ALL MOVES FOUND! 🎉
            handleRoundComplete();
        }
    }, [foundMoves, validMoves]);

    const handleRoundComplete = () => {
        setShowCelebration(true);
        SoundEffects.celebrate();

        // Pick a random surprise reward
        const reward = SURPRISE_REWARDS[Math.floor(Math.random() * SURPRISE_REWARDS.length)];
        setSurpriseReward(reward);

        // After 3 rounds, complete the lesson
        if (round >= 3) {
            setTimeout(() => {
                setShowCelebration(false);
                setLessonComplete(true);

                // Track in progress store
                const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
                const stars = wrongGuesses.size === 0 ? 3 : wrongGuesses.size < 3 ? 2 : 1;

                completeLesson({
                    lessonId: `knight-moves-${Date.now()}`,
                    pieceType: piece,
                    completedAt: Date.now(),
                    score: stars,
                    timeSpent,
                });
            }, 2000);
        } else {
            // Move to next round
            setTimeout(() => {
                setShowCelebration(false);
                setRound(prev => prev + 1);
                setKnightPosition(getRandomPosition());
                setMessage(`Round ${round + 1}! Find all the squares!`);
                setMessageType('hint');
                setTimeout(() => setMessage(''), 2000);
            }, 2000);
        }
    };

    // Handle square tap
    const handleSquareTap = (row: number, col: number) => {
        const targetSquare = positionToSquare({ row, col });

        // Don't allow tapping the knight's current position
        if (knightPosition.row === row && knightPosition.col === col) {
            return;
        }

        // Already found this move
        if (foundMoves.has(targetSquare)) {
            setMessage('Already found! 👀');
            setMessageType('hint');
            setTimeout(() => setMessage(''), 1500);
            return;
        }

        // Already marked as wrong
        if (wrongGuesses.has(targetSquare)) {
            setMessage('Oops, not there! Try again');
            setMessageType('error');
            setTimeout(() => setMessage(''), 1500);
            return;
        }

        // Check if this is a valid move
        if (validMoves.includes(targetSquare)) {
            // CORRECT! ✓
            const newFound = new Set(foundMoves);
            newFound.add(targetSquare);
            setFoundMoves(newFound);

            const pointsEarned = 10;
            setScore(prev => prev + pointsEarned);

            SoundEffects.move();

            const remaining = validMoves.length - newFound.size;
            if (remaining > 0) {
                setMessage(`+${pointsEarned}! ${remaining} more to go! 🎯`);
                setMessageType('success');
            } else {
                setMessage('You found them all! 🎉');
                setMessageType('success');
            }
            setTimeout(() => setMessage(''), 1500);
        } else {
            // WRONG! ✗
            const newWrong = new Set(wrongGuesses);
            newWrong.add(targetSquare);
            setWrongGuesses(newWrong);

            SoundEffects.error();
            setMessage('Not quite! Knights move in L-shapes ♞');
            setMessageType('error');
            setTimeout(() => setMessage(''), 2000);
        }
    };

    // Render a single square
    const renderSquare = (row: number, col: number) => {
        const isLight = (row + col) % 2 === 1;
        const squareName = positionToSquare({ row, col });
        const isKnightHere = knightPosition.row === row && knightPosition.col === col;
        const isFound = foundMoves.has(squareName);
        const isWrong = wrongGuesses.has(squareName);

        return (
            <Pressable
                key={`${row}-${col}`}
                style={({ pressed }) => [
                    styles.square,
                    isLight ? styles.lightSquare : styles.darkSquare,
                    isFound && styles.foundSquare,
                    isWrong && styles.wrongSquare,
                    pressed && styles.pressedSquare,
                ]}
                onPress={() => handleSquareTap(row, col)}
            >
                {isKnightHere && (
                    <Text style={styles.pieceEmoji}>♞</Text>
                )}
                {isFound && !isKnightHere && (
                    <Text style={styles.checkEmoji}>✓</Text>
                )}
                {isWrong && (
                    <Text style={styles.wrongEmoji}>✗</Text>
                )}
            </Pressable>
        );
    };

    // Lesson Complete Screen
    if (lessonComplete) {
        return (
            <LinearGradient
                colors={['#6B4EE6', '#9C27B0', '#E91E63']}
                style={styles.container}
            >
                <SafeAreaView style={styles.completeContainer}>
                    <Text style={styles.completeEmoji}>{surpriseReward.emoji}</Text>
                    <Text style={styles.completeTitle}>Lesson Complete!</Text>
                    <Text style={styles.completeSubtitle}>
                        You earned a {surpriseReward.name}
                    </Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{score}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{3 - Math.min(wrongGuesses.size, 2)}⭐</Text>
                            <Text style={styles.statLabel}>Stars</Text>
                        </View>
                    </View>

                    <Pressable style={styles.doneButton} onPress={onBack}>
                        <Text style={styles.doneButtonText}>🏠 Back to Home</Text>
                    </Pressable>
                </SafeAreaView>
            </LinearGradient>
        );
    }

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
                    <View style={styles.roundContainer}>
                        <Text style={styles.roundLabel}>Round</Text>
                        <Text style={styles.roundValue}>{round}/3</Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>♞ Find the Moves!</Text>
                    <Text style={styles.instructionsText}>
                        Tap ALL squares the Knight can move to
                    </Text>
                    <Text style={styles.progressText}>
                        Found: {foundMoves.size}/{validMoves.length}
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
                </View>

                {/* Hint */}
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>
                        💡 Hint: Knights move in an L-shape (2+1 squares)
                    </Text>
                </View>
            </SafeAreaView>

            {/* Celebration Overlay */}
            <CelebrationOverlay
                visible={showCelebration}
                message={`${surpriseReward.emoji} ${surpriseReward.name}`}
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
    roundContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    roundLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: fontSize.xs,
    },
    roundValue: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: 'bold',
    },
    instructionsContainer: {
        alignItems: 'center',
        marginBottom: spacing.sm,
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
    progressText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        marginTop: spacing.xs,
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
    foundSquare: {
        backgroundColor: '#4CAF50',
    },
    wrongSquare: {
        backgroundColor: '#F44336',
    },
    pressedSquare: {
        opacity: 0.7,
    },
    pieceEmoji: {
        fontSize: SQUARE_SIZE * 0.7,
    },
    checkEmoji: {
        fontSize: SQUARE_SIZE * 0.5,
        color: colors.white,
        fontWeight: 'bold',
    },
    wrongEmoji: {
        fontSize: SQUARE_SIZE * 0.5,
        color: colors.white,
        fontWeight: 'bold',
    },
    hintContainer: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    hintText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: fontSize.sm,
    },
    // Lesson Complete styles
    completeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    completeEmoji: {
        fontSize: 100,
        marginBottom: spacing.lg,
    },
    completeTitle: {
        fontSize: fontSize.giant,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
    },
    completeSubtitle: {
        fontSize: fontSize.lg,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginTop: spacing.xl,
    },
    statBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    statValue: {
        fontSize: fontSize.giant,
        fontWeight: 'bold',
        color: colors.white,
    },
    statLabel: {
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: spacing.xs,
    },
    doneButton: {
        backgroundColor: colors.white,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
    },
    doneButtonText: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: '#6B4EE6',
    },
});
