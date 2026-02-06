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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 360);

// Piece info for display
const PIECE_INFO: Record<PieceType, { emoji: string; name: string; color: string; hint: string }> = {
    pawn: { emoji: '♟', name: 'Pawn', color: '#4CAF50', hint: 'Pawns move forward 1 square (or 2 from start)' },
    knight: { emoji: '♞', name: 'Knight', color: '#FF9800', hint: 'Knights move in an L-shape (2+1 squares)' },
    bishop: { emoji: '♝', name: 'Bishop', color: '#9C27B0', hint: 'Bishops move diagonally any number of squares' },
    rook: { emoji: '♜', name: 'Rook', color: '#2196F3', hint: 'Rooks move straight (horizontal or vertical)' },
    queen: { emoji: '♛', name: 'Queen', color: '#E91E63', hint: 'The Queen moves any direction, any distance!' },
    king: { emoji: '♚', name: 'King', color: '#FFD700', hint: 'Kings move 1 square in any direction' },
};

// Fun surprise rewards
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

type GameMode = 'practice' | 'fastest_finger';

interface PracticeScreenProps {
    piece: PieceType;
    onBack: () => void;
    onComplete?: () => void;
}

export default function PracticeScreen({ piece, onBack, onComplete }: PracticeScreenProps) {
    const pieceInfo = PIECE_INFO[piece];

    // Game mode selection
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
    const squareSize = boardSize / 8;

    // Get appropriate starting position based on piece type
    const getRandomPosition = useCallback((): Position => {
        switch (piece) {
            case 'pawn':
                return { row: 1 + Math.floor(Math.random() * 2), col: Math.floor(Math.random() * 8) };
            case 'king':
                return { row: 2 + Math.floor(Math.random() * 4), col: 2 + Math.floor(Math.random() * 4) };
            default:
                return { row: 2 + Math.floor(Math.random() * 4), col: 2 + Math.floor(Math.random() * 4) };
        }
    }, [piece]);

    const [piecePosition, setPiecePosition] = useState<Position>(getRandomPosition);
    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [targetMoves, setTargetMoves] = useState<string[]>([]);
    const [foundMoves, setFoundMoves] = useState<Set<string>>(new Set());
    const [wrongGuesses, setWrongGuesses] = useState<Set<string>>(new Set());
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lessonComplete, setLessonComplete] = useState(false);
    const [surpriseReward, setSurpriseReward] = useState(SURPRISE_REWARDS[0]);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'hint' | 'error'>('hint');

    // Fastest Finger mode state
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [speedBonus, setSpeedBonus] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTime = useRef(Date.now());
    const moveStartTime = useRef(Date.now());

    const completeLesson = useProgressStore(state => state.completeLesson);

    // Timer for Fastest Finger mode
    useEffect(() => {
        if (gameMode === 'fastest_finger' && isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 100);
            }, 100);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameMode, isTimerRunning]);

    // Calculate valid moves whenever piece position changes
    useEffect(() => {
        if (gameMode) {
            const square = positionToSquare(piecePosition);
            const moves = getValidMoves(piece, square);
            setValidMoves(moves);

            let targets = moves;
            if (['bishop', 'rook', 'queen'].includes(piece) && moves.length > 6) {
                const shuffled = [...moves].sort(() => Math.random() - 0.5);
                targets = shuffled.slice(0, 6);
            }
            setTargetMoves(targets);
            setFoundMoves(new Set());
            setWrongGuesses(new Set());
            moveStartTime.current = Date.now();

            if (gameMode === 'fastest_finger' && round === 1) {
                setIsTimerRunning(true);
            }
        }
    }, [piecePosition, piece, gameMode]);

    // Check if all target moves found
    useEffect(() => {
        if (targetMoves.length > 0 && foundMoves.size === targetMoves.length) {
            handleRoundComplete();
        }
    }, [foundMoves, targetMoves]);

    const handleRoundComplete = () => {
        setShowCelebration(true);
        SoundEffects.celebrate();

        const reward = SURPRISE_REWARDS[Math.floor(Math.random() * SURPRISE_REWARDS.length)];
        setSurpriseReward(reward);

        if (round >= 3) {
            setIsTimerRunning(false);

            setTimeout(() => {
                setShowCelebration(false);
                setLessonComplete(true);

                const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
                const stars = wrongGuesses.size === 0 ? 3 : wrongGuesses.size < 3 ? 2 : 1;

                // Save best time for fastest finger
                if (gameMode === 'fastest_finger') {
                    const currentTime = timer;
                    if (!bestTime || currentTime < bestTime) {
                        setBestTime(currentTime);
                    }
                }

                completeLesson({
                    lessonId: `${piece}-${gameMode}-${Date.now()}`,
                    pieceType: piece,
                    completedAt: Date.now(),
                    score: stars,
                    timeSpent,
                });
            }, 2000);
        } else {
            setTimeout(() => {
                setShowCelebration(false);
                setRound(prev => prev + 1);
                setPiecePosition(getRandomPosition());
                setMessage(`Round ${round + 1}!`);
                setMessageType('hint');
                setTimeout(() => setMessage(''), 1500);
            }, 2000);
        }
    };

    // Handle square tap
    const handleSquareTap = (row: number, col: number) => {
        const targetSquare = positionToSquare({ row, col });

        if (piecePosition.row === row && piecePosition.col === col) return;
        if (foundMoves.has(targetSquare)) {
            setMessage('Already found! 👀');
            setMessageType('hint');
            setTimeout(() => setMessage(''), 1000);
            return;
        }
        if (wrongGuesses.has(targetSquare)) return;

        if (targetMoves.includes(targetSquare)) {
            // CORRECT!
            const newFound = new Set(foundMoves);
            newFound.add(targetSquare);
            setFoundMoves(newFound);

            // Calculate speed bonus for fastest finger
            let pointsEarned = 10;
            if (gameMode === 'fastest_finger') {
                const moveTime = Date.now() - moveStartTime.current;
                if (moveTime < 1000) {
                    pointsEarned += 10; // Super fast bonus
                    setSpeedBonus(prev => prev + 10);
                } else if (moveTime < 2000) {
                    pointsEarned += 5; // Fast bonus
                    setSpeedBonus(prev => prev + 5);
                }
                moveStartTime.current = Date.now();
            }

            setScore(prev => prev + pointsEarned);
            SoundEffects.move();

            const remaining = targetMoves.length - newFound.size;
            if (remaining > 0) {
                const bonusText = gameMode === 'fastest_finger' && pointsEarned > 10 ? ' ⚡' : '';
                setMessage(`+${pointsEarned}${bonusText} ${remaining} left!`);
                setMessageType('success');
            } else {
                setMessage('🎉');
                setMessageType('success');
            }
            setTimeout(() => setMessage(''), 1000);
        } else {
            // WRONG!
            const newWrong = new Set(wrongGuesses);
            newWrong.add(targetSquare);
            setWrongGuesses(newWrong);

            // Time penalty in fastest finger
            if (gameMode === 'fastest_finger') {
                setTimer(prev => prev + 2000); // 2 second penalty
            }

            SoundEffects.error();
            setMessage(`Oops! +2s penalty`);
            setMessageType('error');
            setTimeout(() => setMessage(''), 1500);
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${seconds}.${tenths}s`;
    };

    // Render a single square
    const renderSquare = (row: number, col: number) => {
        const isLight = (row + col) % 2 === 1;
        const squareName = positionToSquare({ row, col });
        const isPieceHere = piecePosition.row === row && piecePosition.col === col;
        const isFound = foundMoves.has(squareName);
        const isWrong = wrongGuesses.has(squareName);

        return (
            <Pressable
                key={`${row}-${col}`}
                style={({ pressed }) => [
                    { width: squareSize, height: squareSize, justifyContent: 'center', alignItems: 'center' },
                    isLight ? styles.lightSquare : styles.darkSquare,
                    isFound && styles.foundSquare,
                    isWrong && styles.wrongSquare,
                    pressed && styles.pressedSquare,
                ]}
                onPress={() => handleSquareTap(row, col)}
            >
                {isPieceHere && <Text style={{ fontSize: squareSize * 0.7 }}>{pieceInfo.emoji}</Text>}
                {isFound && !isPieceHere && <Text style={[styles.checkEmoji, { fontSize: squareSize * 0.5 }]}>✓</Text>}
                {isWrong && <Text style={[styles.wrongEmoji, { fontSize: squareSize * 0.5 }]}>✗</Text>}
            </Pressable>
        );
    };

    // Mode Selection Screen
    if (gameMode === null) {
        return (
            <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
                <SafeAreaView style={styles.modeSelectContainer}>
                    <Pressable onPress={onBack} style={styles.backButtonAbsolute}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </Pressable>

                    <Text style={styles.modeTitle}>{pieceInfo.emoji} {pieceInfo.name} Practice</Text>
                    <Text style={styles.modeSubtitle}>Choose your mode</Text>

                    <View style={styles.modeButtonsContainer}>
                        <Pressable style={styles.modeButton} onPress={() => setGameMode('practice')}>
                            <Text style={styles.modeButtonEmoji}>📚</Text>
                            <Text style={styles.modeButtonTitle}>Learn Mode</Text>
                            <Text style={styles.modeButtonDesc}>Take your time, no pressure</Text>
                        </Pressable>

                        <Pressable style={[styles.modeButton, styles.fastestFingerButton]} onPress={() => setGameMode('fastest_finger')}>
                            <Text style={styles.modeButtonEmoji}>⚡</Text>
                            <Text style={styles.modeButtonTitle}>Fastest Finger</Text>
                            <Text style={styles.modeButtonDesc}>Speed + Accuracy = Victory!</Text>
                        </Pressable>
                    </View>

                    {/* Board Size Controls */}
                    <View style={styles.sizeControlContainer}>
                        <Text style={styles.sizeLabel}>Board Size</Text>
                        <View style={styles.sizeButtons}>
                            <Pressable
                                style={styles.sizeButton}
                                onPress={() => setBoardSize(prev => Math.max(200, prev - 40))}
                            >
                                <Text style={styles.sizeButtonText}>−</Text>
                            </Pressable>
                            <Text style={styles.sizeValue}>{Math.round(boardSize)}</Text>
                            <Pressable
                                style={styles.sizeButton}
                                onPress={() => setBoardSize(prev => Math.min(SCREEN_WIDTH - 20, prev + 40))}
                            >
                                <Text style={styles.sizeButtonText}>+</Text>
                            </Pressable>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Lesson Complete Screen
    if (lessonComplete) {
        return (
            <LinearGradient colors={['#6B4EE6', '#9C27B0', '#E91E63']} style={styles.container}>
                <SafeAreaView style={styles.completeContainer}>
                    <Text style={styles.completeEmoji}>{surpriseReward.emoji}</Text>
                    <Text style={styles.completeTitle}>Lesson Complete!</Text>
                    <Text style={styles.completeSubtitle}>You earned a {surpriseReward.name}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{score}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        {gameMode === 'fastest_finger' && (
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{formatTime(timer)}</Text>
                                <Text style={styles.statLabel}>Time</Text>
                            </View>
                        )}
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{3 - Math.min(wrongGuesses.size, 2)}⭐</Text>
                            <Text style={styles.statLabel}>Stars</Text>
                        </View>
                    </View>

                    {gameMode === 'fastest_finger' && speedBonus > 0 && (
                        <Text style={styles.speedBonusText}>⚡ Speed Bonus: +{speedBonus} pts!</Text>
                    )}

                    <Pressable style={styles.doneButton} onPress={onBack}>
                        <Text style={styles.doneButtonText}>🏠 Back to Home</Text>
                    </Pressable>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header - Fixed Position */}
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </Pressable>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Score</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                    </View>
                    {gameMode === 'fastest_finger' && (
                        <View style={[styles.scoreContainer, styles.timerContainer]}>
                            <Text style={styles.scoreLabel}>⚡ Time</Text>
                            <Text style={styles.scoreValue}>{formatTime(timer)}</Text>
                        </View>
                    )}
                    <View style={styles.roundContainer}>
                        <Text style={styles.roundLabel}>Round</Text>
                        <Text style={styles.roundValue}>{round}/3</Text>
                    </View>
                </View>

                {/* Main Content - Flex layout with centered board */}
                <View style={styles.mainContent}>
                    {/* Instructions - Top */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>
                            {gameMode === 'fastest_finger' ? '⚡ ' : ''}{pieceInfo.emoji} Find the Moves!
                        </Text>
                        <Text style={styles.progressText}>Found: {foundMoves.size}/{targetMoves.length}</Text>
                    </View>

                    {/* Board - Centered with fixed position */}
                    <View style={styles.boardWrapper}>
                        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                            {[...Array(8)].map((_, rowFromTop) => {
                                const row = 7 - rowFromTop;
                                return (
                                    <View key={row} style={styles.boardRow}>
                                        {[...Array(8)].map((_, col) => renderSquare(row, col))}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Message Overlay - Positioned on board, doesn't shift layout */}
                        {message ? (
                            <View style={[
                                styles.messageOverlay,
                                messageType === 'success' && styles.successMessage,
                                messageType === 'error' && styles.errorMessage,
                            ]}>
                                <Text style={styles.messageText}>{message}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Hint - Bottom */}
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintText}>💡 {pieceInfo.hint}</Text>
                    </View>
                </View>
            </SafeAreaView>

            <CelebrationOverlay visible={showCelebration} message={`${surpriseReward.emoji} ${surpriseReward.name}`} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, padding: spacing.md },

    // Mode selection
    modeSelectContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    modeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white, marginBottom: spacing.sm },
    modeSubtitle: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xl },
    modeButtonsContainer: { gap: spacing.lg, width: '100%', maxWidth: 300 },
    modeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    fastestFingerButton: { backgroundColor: 'rgba(255,193,7,0.3)' },
    modeButtonEmoji: { fontSize: 48, marginBottom: spacing.sm },
    modeButtonTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.white },
    modeButtonDesc: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
    sizeControlContainer: { marginTop: spacing.xl, alignItems: 'center' },
    sizeLabel: { color: colors.white, fontSize: fontSize.md, marginBottom: spacing.sm },
    sizeButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    sizeButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sizeButtonText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
    sizeValue: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold', minWidth: 60, textAlign: 'center' },
    backButtonAbsolute: { position: 'absolute', top: 60, left: 20, padding: spacing.sm },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    backButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    backButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
    scoreContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    timerContainer: { backgroundColor: 'rgba(255,193,7,0.4)' },
    scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs },
    scoreValue: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    roundContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    roundLabel: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs },
    roundValue: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },

    // Main content - fixed layout
    mainContent: { flex: 1, justifyContent: 'space-between' },
    instructionsContainer: { alignItems: 'center' },
    instructionsTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    progressText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold', marginTop: spacing.xs },

    // Board wrapper - centers the board and contains the message overlay
    boardWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
    board: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    boardRow: { flexDirection: 'row' },

    // Message overlay - absolute positioned on top of board
    messageOverlay: {
        position: 'absolute',
        top: -40,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        zIndex: 10,
    },
    successMessage: { backgroundColor: 'rgba(76,175,80,0.95)' },
    errorMessage: { backgroundColor: 'rgba(244,67,54,0.95)' },
    messageText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },

    hintContainer: { alignItems: 'center', paddingBottom: spacing.md },
    hintText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm, textAlign: 'center' },

    // Squares
    lightSquare: { backgroundColor: '#F0D9B5' },
    darkSquare: { backgroundColor: '#B58863' },
    foundSquare: { backgroundColor: '#4CAF50' },
    wrongSquare: { backgroundColor: '#F44336' },
    pressedSquare: { opacity: 0.7 },
    checkEmoji: { color: colors.white, fontWeight: 'bold' },
    wrongEmoji: { color: colors.white, fontWeight: 'bold' },

    // Complete screen
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    completeEmoji: { fontSize: 100, marginBottom: spacing.lg },
    completeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white },
    completeSubtitle: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm },
    statsContainer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
    statBox: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    statValue: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.white },
    statLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
    speedBonusText: { color: '#FFD700', fontSize: fontSize.lg, fontWeight: 'bold', marginTop: spacing.md },
    doneButton: {
        backgroundColor: colors.white,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
    },
    doneButtonText: { fontSize: fontSize.lg, fontWeight: '600', color: '#6B4EE6' },
});
