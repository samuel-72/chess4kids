import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { getValidMoves, Position, positionToSquare } from '../../utils/chessLogic';
import { PIECE_IMAGES } from '../../constants/pieces';
import { PieceType, useProgressStore } from '../../stores/progressStore';
import CelebrationOverlay from '../../components/CelebrationOverlay';
import { SoundEffects } from '../../utils/soundEffects';
import { MoveTutorial } from '../../components/MoveTutorial';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 360);

// Piece info for display
const PIECE_INFO: Record<PieceType, { emoji: string; name: string; color: string; hint: string }> = {
    pawn: { emoji: '♟', name: 'Pawn', color: '#4CAF50', hint: 'Pawns move 1 step forward!' },
    knight: { emoji: '♞', name: 'Knight', color: '#FF9800', hint: 'Knights jump in an L shape!' },
    bishop: { emoji: '♝', name: 'Bishop', color: '#9C27B0', hint: 'Bishops zoom diagonally!' },
    rook: { emoji: '♜', name: 'Rook', color: '#2196F3', hint: 'Rooks move straight lines!' },
    queen: { emoji: '♛', name: 'Queen', color: '#E91E63', hint: 'Queen goes anywhere she wants!' },
    king: { emoji: '♚', name: 'King', color: '#FFD700', hint: 'Kings step 1 square gently.' },
};

const SURPRISE_REWARDS = [
    { emoji: '🍫', name: 'Chocolate Bar!' },
    { emoji: '🦄', name: 'Magical Unicorn!' },
    { emoji: '🦕', name: 'Friendly Dinosaur!' },
    { emoji: '🎁', name: 'Mystery Gift!' },
    { emoji: '👑', name: 'Golden Crown!' },
];

type GameMode = 'practice' | 'fastest_finger';

export default function LessonScreen() {
    const { piece: pieceParam } = useLocalSearchParams<{ piece: PieceType }>();
    const piece = pieceParam as PieceType;
    const pieceInfo = PIECE_INFO[piece];

    const onBack = () => router.back();

    // Game mode selection
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE);

    // Pan Gesture State
    const boardOffsetX = useSharedValue(0);
    const boardOffsetY = useSharedValue(0);
    const savedOffsetX = useSharedValue(0);
    const savedOffsetY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            boardOffsetX.value = savedOffsetX.value + e.translationX;
            boardOffsetY.value = savedOffsetY.value + e.translationY;
        })
        .onEnd(() => {
            savedOffsetX.value = boardOffsetX.value;
            savedOffsetY.value = boardOffsetY.value;
        });

    const animatedBoardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: boardOffsetX.value },
            { translateY: boardOffsetY.value }
        ]
    }));

    // Generate a scenario (piece position + enemies)
    const generateScenario = useCallback((currentRound: number = 1): { piecePos: Position; enemies: Position[]; enPassantTarget?: string; hint?: string } => {
        let piecePos: Position;
        const enemies: Position[] = [];
        let enPassantTarget: string | undefined;
        let hint: string | undefined;

        switch (piece) {
            case 'pawn':
                // Deterministic Lesson Plan for Pawns
                if (currentRound === 3 || currentRound === 4) {
                    // FORCE CAPTURE
                    piecePos = { row: 3, col: 3 + Math.floor(Math.random() * 2) }; // Rank 4
                    const side = Math.random() > 0.5 ? 1 : -1;
                    const enemyPos = { row: piecePos.row + 1, col: piecePos.col + side };
                    enemies.push(enemyPos);
                    hint = "Capturing is fun! ⚔️";
                }
                else if (currentRound === 5) {
                    // FORCE EN PASSANT
                    piecePos = { row: 4, col: 3 };
                    const side = 1;
                    const enemyPos = { row: 4, col: piecePos.col + side };
                    enemies.push(enemyPos);
                    const targetPos = { row: 5, col: enemyPos.col };
                    enPassantTarget = positionToSquare(targetPos);
                    hint = "En Passant! The enemy pawn just jumped 2 steps! 👻";
                }
                else {
                    // RANDOM
                    piecePos = {
                        row: 1 + Math.floor(Math.random() * 5),
                        col: Math.floor(Math.random() * 8)
                    };
                    if (currentRound > 1 && Math.random() > 0.6) {
                        const side = Math.random() > 0.5 ? 1 : -1;
                        const enemyPos = { row: piecePos.row + 1, col: piecePos.col + side };
                        if (enemyPos.col >= 0 && enemyPos.col < 8 && enemyPos.row < 8) {
                            enemies.push(enemyPos);
                        }
                    }
                }
                break;
            default:
                piecePos = { row: 2 + Math.floor(Math.random() * 4), col: 2 + Math.floor(Math.random() * 4) };
                break;
        }
        return { piecePos, enemies, enPassantTarget, hint };
    }, [piece]);

    // Initialize state
    const [scenario, setScenario] = useState(() => generateScenario(1));
    const { piecePos: piecePosition, enemies, enPassantTarget, hint } = scenario;
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


    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [speedBonus, setSpeedBonus] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTime = useRef(Date.now());
    const moveStartTime = useRef(Date.now());

    // Show initial hint if present
    useEffect(() => {
        if (hint) {
            setMessage(hint);
            setMessageType('hint');
            setTimeout(() => setMessage(''), 3000);
        }
    }, [hint]);

    const completeLesson = useProgressStore(state => state.completeLesson);

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

    // Calculate valid moves
    useEffect(() => {
        if (gameMode) {
            const square = positionToSquare(piecePosition);
            const moves = getValidMoves(piece, square, enemies, enPassantTarget);
            setValidMoves(moves);

            // FIX: Removed the cap of 6. Now the user must find ALL valid moves.
            setTargetMoves(moves);

            setFoundMoves(new Set());
            setWrongGuesses(new Set());
            moveStartTime.current = Date.now();

            if (gameMode === 'fastest_finger' && round === 1) {
                setIsTimerRunning(true);
            }
        }
    }, [piecePosition, enemies, enPassantTarget, piece, gameMode]);

    useEffect(() => {
        const goal = targetMoves.length; // Full goal
        if (targetMoves.length > 0 && foundMoves.size >= goal) {
            handleRoundComplete();
        }
    }, [foundMoves, targetMoves]);

    const handleRoundComplete = () => {
        setShowCelebration(true);
        SoundEffects.celebrate();

        const reward = SURPRISE_REWARDS[Math.floor(Math.random() * SURPRISE_REWARDS.length)];
        setSurpriseReward(reward);

        // SAVE PROGRESS IMMEDIATELY (Per Task)
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

        if (round >= 6) {
            setIsTimerRunning(false);

            setTimeout(() => {
                setShowCelebration(false);
                setLessonComplete(true);
            }, 2000);
        } else {
            setTimeout(() => {
                setShowCelebration(false);
                setRound(prev => prev + 1);

                // Generate NEW scenario
                let newScenario = generateScenario(round + 1);
                // Simple retry once if position matches
                if (round + 1 > 5 && newScenario.piecePos.row === piecePosition.row && newScenario.piecePos.col === piecePosition.col) {
                    newScenario = generateScenario(round + 1);
                }
                setScenario(newScenario);

                setMessage(`Round ${round + 1}!`);
                setMessageType('hint');
                setTimeout(() => setMessage(''), 1500);
            }, 2000);
        }
    };

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

        // FIXED LOGIC: validMoves tracks truth.
        if (validMoves.includes(targetSquare)) {
            // CORRECT!
            const newFound = new Set(foundMoves);
            newFound.add(targetSquare);
            setFoundMoves(newFound);

            // Calculate speed bonus
            let pointsEarned = 10;
            if (gameMode === 'fastest_finger') {
                const moveTime = Date.now() - moveStartTime.current;
                if (moveTime < 1000) {
                    pointsEarned += 10;
                    setSpeedBonus(prev => prev + 10);
                } else if (moveTime < 2000) {
                    pointsEarned += 5;
                    setSpeedBonus(prev => prev + 5);
                }
                moveStartTime.current = Date.now();
            }

            setScore(prev => prev + pointsEarned);
            SoundEffects.move();

            const goal = targetMoves.length; // Full goal
            const remaining = goal - newFound.size;

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

            if (gameMode === 'fastest_finger') {
                setTimer(prev => prev + 2000);
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

    const renderSquare = (row: number, col: number, squareSize: number) => {
        const isLight = (row + col) % 2 === 1; // Corrected lightness check (usually light is even sum? wait, a1 (0,0) is dark. 0+0=0. b1 (0,1) is light. 0+1=1. So odd sum is light.)
        const squareName = positionToSquare({ row, col });
        const isPieceHere = piecePosition.row === row && piecePosition.col === col;
        // Check for enemies
        const isEnemyHere = enemies.some(e => e.row === row && e.col === col);
        const isEPTarget = squareName === enPassantTarget;

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

                {isPieceHere && (
                    <Image
                        source={PIECE_IMAGES[piece]}
                        style={{ width: squareSize * 0.8, height: squareSize * 0.8 }}
                        resizeMode="contain"
                    />
                )}

                {isEnemyHere && (
                    <Text style={{ fontSize: squareSize * 0.7, color: 'black' }}>♟</Text>
                )}

                {isFound && !isPieceHere && !isEnemyHere && <Text style={[styles.checkEmoji, { fontSize: squareSize * 0.5 }]}>✓</Text>}
                {isFound && (isEnemyHere || isEPTarget) && <Text style={[styles.checkEmoji, { fontSize: squareSize * 0.5, color: '#FFF', position: 'absolute', zIndex: 2 }]}>⚔️</Text>}

                {isWrong && <Text style={[styles.wrongEmoji, { fontSize: squareSize * 0.5 }]}>✗</Text>}
            </Pressable>
        );
    };

    if (gameMode === null) {
        return (
            <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
                <SafeAreaView style={styles.modeSelectContainer}>
                    <Pressable onPress={onBack} style={styles.backButtonAbsolute}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </Pressable>

                    <Text style={styles.modeTitle}>{pieceInfo.emoji} {pieceInfo.name}</Text>


                    {/* Animated Tutorial */}
                    <View style={styles.tutorialContainer}>
                        {piece === 'pawn' ? (
                            <View style={styles.pawnTutorials}>
                                <MoveTutorial
                                    piece={piece}
                                    variant="movement"
                                />
                                <MoveTutorial
                                    piece={piece}
                                    variant="promotion"
                                />
                            </View>
                        ) : (
                            <MoveTutorial piece={piece} />
                        )}
                        <Text style={styles.tutorialText}>
                            {pieceInfo.hint}
                        </Text>
                    </View>

                    <View style={styles.modeButtonsContainer}>
                        <Pressable style={styles.modeButton} onPress={() => setGameMode('practice')}>
                            <Text style={styles.modeButtonEmoji}>📚</Text>
                            <Text style={styles.modeButtonTitle}>Learn Mode</Text>
                            <Text style={styles.modeButtonDesc}>Take your time</Text>
                        </Pressable>

                        <Pressable style={[styles.modeButton, styles.fastestFingerButton]} onPress={() => setGameMode('fastest_finger')}>
                            <Text style={styles.modeButtonEmoji}>⚡</Text>
                            <Text style={styles.modeButtonTitle}>Fastest Finger</Text>
                            <Text style={styles.modeButtonDesc}>Speed Challenge!</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (lessonComplete) {
        return (
            <LinearGradient colors={['#6B4EE6', '#9C27B0', '#E91E63']} style={styles.container}>
                <SafeAreaView style={styles.completeContainer}>
                    <Text style={styles.completeEmoji}>{surpriseReward.emoji}</Text>
                    <Text style={styles.completeTitle}>Lesson Complete!</Text>
                    <Text style={styles.completeSubtitle}>You earned a {surpriseReward.name}</Text>
                    <Pressable style={styles.doneButton} onPress={onBack}>
                        <Text style={styles.doneButtonText}>🏠 Back to Home</Text>
                    </Pressable>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // MAIN GAME
    const squareSize = boardSize / 8;
    const goalText = targetMoves.length; // Full goal

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Pressable onPress={onBack} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </Pressable>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Score</Text>
                            <Text style={styles.scoreValue}>{score}</Text>
                        </View>
                    </View>

                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>
                            {gameMode === 'fastest_finger' ? '⚡ ' : ''}{pieceInfo.emoji} Find the Moves!
                        </Text>
                        <Text style={styles.progressText}>Found: {foundMoves.size}/{goalText}</Text>
                    </View>

                    <View style={styles.mainContent}>
                        {/* Draggable Board Container */}
                        <GestureDetector gesture={panGesture}>
                            <Animated.View style={[styles.boardWrapper, animatedBoardStyle]}>
                                {/* Outer Board Container with Labels */}
                                <View style={styles.boardContainerExternal}>
                                    {/* Top File Labels */}
                                    <View style={[styles.fileRow, { width: boardSize }]}>
                                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, i) => (
                                            <Text key={file} style={styles.coordLabelExternal}>{file}</Text>
                                        ))}
                                    </View>

                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Left Rank Labels */}
                                        <View style={[styles.rankColumn, { height: boardSize }]}>
                                            {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
                                                <Text key={rank} style={styles.coordLabelExternal}>{rank}</Text>
                                            ))}
                                        </View>

                                        {/* The Board */}
                                        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                                            {[...Array(8)].map((_, rowFromTop) => {
                                                const row = 7 - rowFromTop;
                                                return (
                                                    <View key={row} style={styles.boardRow}>
                                                        {[...Array(8)].map((_, col) => renderSquare(row, col, squareSize))}
                                                    </View>
                                                );
                                            })}
                                        </View>

                                        {/* Right Rank Labels (Optional balance) */}
                                        <View style={[styles.rankColumn, { height: boardSize }]}>
                                            {/* Empty for symmetry or repeat labels */}
                                        </View>
                                    </View>

                                    {/* Bottom File Labels */}
                                    {/* <View style={[styles.fileRow, { width: boardSize, paddingLeft: 20 }]}><Text>...</Text></View> */}
                                </View>

                                {message ? (
                                    <View style={[
                                        styles.messageOverlay,
                                        messageType === 'success' && styles.successMessage,
                                        messageType === 'error' && styles.errorMessage,
                                    ]}>
                                        <Text style={styles.messageText}>{message}</Text>
                                    </View>
                                ) : null}
                            </Animated.View>
                        </GestureDetector>

                        <View style={styles.controlsFooter}>
                            <Text style={styles.hintText}>💡 Drag board to move, +/- to resize</Text>
                            <View style={styles.sizeControlContainerInGame}>
                                <Pressable
                                    style={styles.sizeButtonSmall}
                                    onPress={() => setBoardSize(prev => Math.max(200, prev - 40))}
                                >
                                    <Text style={styles.sizeButtonTextSmall}>-</Text>
                                </Pressable>
                                <Pressable
                                    style={styles.sizeButtonSmall}
                                    onPress={() => setBoardSize(prev => Math.min(SCREEN_WIDTH * 1.5, prev + 40))}
                                >
                                    <Text style={styles.sizeButtonTextSmall}>+</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>

                <CelebrationOverlay visible={showCelebration} message={`${surpriseReward.emoji} ${surpriseReward.name}`} />
            </LinearGradient>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    modeSelectContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    modeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white, marginBottom: spacing.sm },

    tutorialContainer: { alignItems: 'center', marginVertical: spacing.xl },
    pawnTutorials: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
    },
    tutorialText: { color: colors.white, fontSize: fontSize.md, marginTop: spacing.md, textAlign: 'center', maxWidth: 300 },

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

    backButtonAbsolute: { position: 'absolute', top: 20, left: 20, padding: spacing.sm },
    backButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    backButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    scoreContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: spacing.sm, borderRadius: borderRadius.md },
    scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    scoreValue: { color: colors.white, fontSize: 20, fontWeight: 'bold' },

    mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

    instructionsContainer: { alignItems: 'center', marginVertical: spacing.sm },
    instructionsTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    progressText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },

    boardWrapper: { alignItems: 'center', justifyContent: 'center' },
    board: { borderRadius: borderRadius.md, overflow: 'hidden', elevation: 8, backgroundColor: '#333' },
    boardRow: { flexDirection: 'row' },

    messageOverlay: { position: 'absolute', top: -50, padding: spacing.md, borderRadius: 20, zIndex: 10 },
    successMessage: { backgroundColor: 'green' },
    errorMessage: { backgroundColor: 'red' },
    messageText: { color: 'white', fontWeight: 'bold' },

    controlsFooter: { position: 'absolute', bottom: 20, width: '100%', alignItems: 'center' },
    hintText: { color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
    sizeControlContainerInGame: { flexDirection: 'row', gap: 20 },
    sizeButtonSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    sizeButtonTextSmall: { color: 'white', fontSize: 24, fontWeight: 'bold' },

    // Complete screen
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    completeEmoji: { fontSize: 100, marginBottom: spacing.lg },
    completeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white },
    completeSubtitle: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm },
    doneButton: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, marginTop: spacing.xl },
    doneButtonText: { color: '#6B4EE6', fontWeight: 'bold', fontSize: 18 },

    lightSquare: { backgroundColor: '#F0D9B5' },
    darkSquare: { backgroundColor: '#B58863' },
    foundSquare: { backgroundColor: '#4CAF50' },
    wrongSquare: { backgroundColor: '#F44336' },
    pressedSquare: { opacity: 0.7 },
    checkEmoji: { color: colors.white, fontWeight: 'bold' },
    wrongEmoji: { color: colors.white, fontWeight: 'bold' },
    coordLabelExternal: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    boardContainerExternal: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 20,
    },
    rankColumn: {
        width: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});
