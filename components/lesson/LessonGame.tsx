import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { colors, spacing, borderRadius, fontSize } from '../../constants/theme';
import { PIECE_INFO, REAL_PIECES } from '../../constants/gameData';
import { PIECE_IMAGES } from '../../constants/pieces';
import { Scenario } from '../../hooks/useGameScenarios';
import { getPieceScale } from '../../utils/pieceScaling';
import CelebrationOverlay from '../CelebrationOverlay';
import { EnPassantArrow } from '../EnPassantArrow';
import { PieceType, GameMode } from '../../types/chess';

interface LessonGameProps {
    piece: PieceType;
    scenario: Scenario;
    score: number;
    foundMoves: Set<string>;
    targetMoves: string[]; // Used for goal count
    wrongGuesses: Set<string>;
    message: string;
    messageType: 'success' | 'hint' | 'error';
    onSquareTap: (row: number, col: number) => void;
    onBack: () => void;
    showCelebration: boolean;
    surpriseReward: { emoji: string; name: string };
    gameMode: GameMode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.55, 360);

export const LessonGame: React.FC<LessonGameProps> = ({
    piece,
    scenario,
    score,
    foundMoves,
    targetMoves,
    wrongGuesses,
    message,
    messageType,
    onSquareTap,
    onBack,
    showCelebration,
    surpriseReward,
    gameMode
}) => {
    const pieceInfo = PIECE_INFO[piece];
    const { piecePos: piecePosition, enemies, friendlies, enPassantTarget, enPassantArrow } = scenario;

    const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE);
    const squareSize = boardSize / 8;

    // Pan Gesture
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

    const renderSquare = (row: number, col: number) => {
        const isLight = (row + col) % 2 === 1;
        const squareName = String.fromCharCode('A'.charCodeAt(0) + col) + (row + 1);

        const isPieceHere = piecePosition.row === row && piecePosition.col === col;
        const isEnemyHere = enemies.some(e => e.row === row && e.col === col);
        const friendlyHere = friendlies.find(f => f.row === row && f.col === col);
        const isFriendlyHere = !!friendlyHere;
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
                onPress={() => onSquareTap(row, col)}
            >
                {isPieceHere && (
                    <Image
                        source={PIECE_IMAGES[piece]}
                        style={{ width: squareSize * getPieceScale(piece), height: squareSize * getPieceScale(piece) }}
                        resizeMode="contain"
                    />
                )}
                {isEnemyHere && (
                    <Text style={{ fontSize: squareSize * 0.7, color: 'black' }}>♟</Text>
                )}
                {isFriendlyHere && friendlyHere && (
                    piece === 'king' && friendlyHere.type === 'rook' ? (
                        <Image
                            source={PIECE_IMAGES['rook']}
                            style={{ width: squareSize * getPieceScale('rook'), height: squareSize * getPieceScale('rook') }}
                            resizeMode="contain"
                        />
                    ) : (
                        <Image
                            source={REAL_PIECES[friendlyHere.type]}
                            style={{
                                width: squareSize * getPieceScale(friendlyHere.type),
                                height: squareSize * getPieceScale(friendlyHere.type),
                                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2,
                            }}
                            resizeMode="contain"
                        />
                    )
                )}

                {isFound && !isPieceHere && !isEnemyHere && <Text style={[styles.checkEmoji, { fontSize: squareSize * 0.5 }]}>✓</Text>}
                {isFound && (isEnemyHere || isEPTarget) && <Text style={[styles.checkEmoji, { fontSize: squareSize * 0.5, color: '#FFF', position: 'absolute', zIndex: 2 }]}>⚔️</Text>}
                {isWrong && <Text style={[styles.wrongEmoji, { fontSize: squareSize * 0.5 }]}>✗</Text>}
            </Pressable>
        );
    };

    const goalText = targetMoves.length;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
                <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={onBack} style={styles.backButton} hitSlop={20}>
                            <Text style={[styles.backButtonText, { fontSize: 24 }]}>←</Text>
                        </Pressable>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Score</Text>
                            <Text style={styles.scoreValue}>{score}</Text>
                        </View>
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>
                            {gameMode === 'fastest_finger' ? '⚡ ' : ''}{pieceInfo.emoji} Find the Moves!
                        </Text>
                        <Text style={styles.progressText}>Found: {foundMoves.size}/{goalText}</Text>
                    </View>

                    {/* Main Board Area */}
                    <View style={styles.mainContent}>
                        <GestureDetector gesture={panGesture}>
                            <Animated.View style={[styles.boardWrapper, animatedBoardStyle]}>
                                <View style={styles.boardContainerExternal}>
                                    {/* Files Top */}
                                    <View style={[styles.fileRow, { width: boardSize }]}>
                                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
                                            <Text key={file} style={styles.coordLabelExternal}>{file}</Text>
                                        ))}
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Ranks Left */}
                                        <View style={[styles.rankColumn, { height: boardSize }]}>
                                            {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
                                                <Text key={rank} style={styles.coordLabelExternal}>{rank}</Text>
                                            ))}
                                        </View>
                                        {/* Logic Board */}
                                        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                                            {[...Array(8)].map((_, rowFromTop) => {
                                                const row = 7 - rowFromTop;
                                                return (
                                                    <View key={row} style={styles.boardRow}>
                                                        {[...Array(8)].map((_, col) => renderSquare(row, col))}
                                                    </View>
                                                );
                                            })}
                                            {/* En passant arrow overlay */}
                                            {enPassantArrow && (
                                                <EnPassantArrow
                                                    from={enPassantArrow.from}
                                                    to={enPassantArrow.to}
                                                    squareSize={squareSize}
                                                />
                                            )}
                                        </View>
                                        <View style={[styles.rankColumn, { height: boardSize }]} />
                                    </View>
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
                                <Pressable style={styles.sizeButtonSmall} onPress={() => setBoardSize(prev => Math.max(200, prev - 40))}>
                                    <Text style={styles.sizeButtonTextSmall}>-</Text>
                                </Pressable>
                                <Pressable style={styles.sizeButtonSmall} onPress={() => setBoardSize(prev => Math.min(SCREEN_WIDTH * 1.5, prev + 40))}>
                                    <Text style={styles.sizeButtonTextSmall}>+</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>

                <CelebrationOverlay visible={showCelebration} message={`${surpriseReward.emoji} ${surpriseReward.name} `} />
            </LinearGradient>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, zIndex: 100 },
    backButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    backButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
    scoreContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: spacing.sm, borderRadius: borderRadius.md },
    scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    scoreValue: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
    instructionsContainer: { alignItems: 'center', marginVertical: spacing.sm },
    instructionsTitle: { color: colors.white, fontSize: fontSize.xl, fontWeight: 'bold' },
    progressText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
    mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    boardWrapper: { alignItems: 'center', justifyContent: 'center' },
    boardContainerExternal: { alignItems: 'center', justifyContent: 'center' },
    board: { borderRadius: borderRadius.md, overflow: 'hidden', elevation: 8, backgroundColor: '#333' },
    boardRow: { flexDirection: 'row' },
    fileRow: { flexDirection: 'row', justifyContent: 'space-around', height: 20 },
    rankColumn: { width: 20, justifyContent: 'space-around', alignItems: 'center' },
    coordLabelExternal: { fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', flex: 1, textAlign: 'center', textAlignVertical: 'center' },
    lightSquare: { backgroundColor: '#F0D9B5' },
    darkSquare: { backgroundColor: '#B58863' },
    foundSquare: { backgroundColor: '#4CAF50' },
    wrongSquare: { backgroundColor: '#F44336' },
    pressedSquare: { opacity: 0.7 },
    checkEmoji: { color: colors.white, fontWeight: 'bold' },
    wrongEmoji: { color: colors.white, fontWeight: 'bold' },
    messageOverlay: { position: 'absolute', top: -50, padding: spacing.md, borderRadius: 20, zIndex: 10 },
    successMessage: { backgroundColor: 'green' },
    errorMessage: { backgroundColor: 'red' },
    messageText: { color: 'white', fontWeight: 'bold' },
    controlsFooter: { position: 'absolute', bottom: 20, width: '100%', alignItems: 'center' },
    hintText: { color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
    sizeControlContainerInGame: { flexDirection: 'row', gap: 20 },
    sizeButtonSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    sizeButtonTextSmall: { color: 'white', fontSize: 24, fontWeight: 'bold' },
});
