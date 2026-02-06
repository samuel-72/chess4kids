import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    Vibration,
    Platform,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChessBoard } from '../components/ChessBoard';
import { RewardAnimation, ConfettiAnimation } from '../components/RewardAnimation';
import { useProgressStore, PieceType } from '../stores/progressStore';
import {
    Lesson,
    getLessonsForPiece,
    getNextLesson
} from '../utils/lessonGenerator';
import {
    getValidMoves,
    isValidMove,
    Square
} from '../utils/chessLogic';
import {
    colors,
    spacing,
    fontSize,
    borderRadius,
    pieceSymbols,
    pieceEmojis,
} from '../constants/theme';

interface LessonScreenProps {
    piece: PieceType;
    onBack: () => void;
}

export default function LessonScreen({ piece, onBack }: LessonScreenProps) {
    const pieceType = piece;

    const { lessonsCompleted, completeLesson, addXP } = useProgressStore();

    // Lesson state
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [piecePosition, setPiecePosition] = useState<Square>('D4');
    const [targetSquares, setTargetSquares] = useState<Square[]>([]);
    const [collectedSquares, setCollectedSquares] = useState<Square[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [showReward, setShowReward] = useState(false);
    const [rewardType, setRewardType] = useState<'chocolate' | 'star' | 'error' | 'success'>('chocolate');
    const [showConfetti, setShowConfetti] = useState(false);
    const [lessonComplete, setLessonComplete] = useState(false);
    const [startTime] = useState(Date.now());

    // Animation values
    const headerScale = useSharedValue(1);

    // Load a lesson
    const loadLesson = useCallback(() => {
        const allLessons = getLessonsForPiece(pieceType);
        const completed = lessonsCompleted[pieceType] || [];
        const nextLesson = getNextLesson(pieceType, completed, allLessons);

        if (nextLesson) {
            setCurrentLesson(nextLesson);
            setPiecePosition(nextLesson.startPosition);
            setTargetSquares(nextLesson.targetSquares);
            setCollectedSquares([]);
            setMistakes(0);
            setLessonComplete(false);
        }
    }, [pieceType, lessonsCompleted]);

    // Initialize
    useEffect(() => {
        loadLesson();
    }, []);

    // Get valid moves from current position
    const validMoves = useMemo(() => {
        if (!pieceType || !piecePosition) return [];
        return getValidMoves(pieceType, piecePosition);
    }, [pieceType, piecePosition]);

    // Handle square press - this is where the magic happens!
    const handleSquarePress = useCallback((targetSquare: Square) => {
        if (lessonComplete) return;
        if (targetSquare === piecePosition) return;

        const isValid = isValidMove(pieceType, piecePosition, targetSquare);

        if (isValid) {
            // Valid move!
            setPiecePosition(targetSquare);

            // Check if this is a target square (has a chocolate)
            if (targetSquares.includes(targetSquare) && !collectedSquares.includes(targetSquare)) {
                // Collect the reward!
                setCollectedSquares(prev => [...prev, targetSquare]);
                setRewardType('chocolate');
                setShowReward(true);

                // Haptic feedback
                if (Platform.OS !== 'web') {
                    Vibration.vibrate(50);
                }

                // Check if all targets collected
                const newCollected = [...collectedSquares, targetSquare];
                if (newCollected.length === targetSquares.length) {
                    // Lesson complete!
                    setTimeout(() => {
                        handleLessonComplete();
                    }, 1000);
                }
            }
        } else {
            // Invalid move!
            setMistakes(prev => prev + 1);
            setRewardType('error');
            setShowReward(true);

            // Shake animation
            headerScale.value = withSequence(
                withTiming(1.05, { duration: 50 }),
                withTiming(0.95, { duration: 100 }),
                withTiming(1, { duration: 50 })
            );

            // Haptic feedback
            if (Platform.OS !== 'web') {
                Vibration.vibrate([0, 100, 50, 100]);
            }
        }
    }, [pieceType, piecePosition, targetSquares, collectedSquares, lessonComplete]);

    // Handle lesson completion
    const handleLessonComplete = useCallback(() => {
        if (!currentLesson) return;

        setLessonComplete(true);
        setShowConfetti(true);
        setRewardType('success');
        setShowReward(true);

        // Calculate score based on mistakes (3 stars = 0 mistakes, 2 = 1-2, 1 = 3+)
        const score = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Save progress
        completeLesson({
            lessonId: currentLesson.id,
            pieceType: currentLesson.pieceType,
            completedAt: Date.now(),
            score,
            timeSpent,
        });

        // Bonus XP for perfect score
        if (score === 3) {
            addXP(10); // Extra bonus!
        }
    }, [currentLesson, mistakes, startTime, completeLesson, addXP]);

    // Handle next lesson
    const handleNextLesson = () => {
        setShowConfetti(false);
        setShowReward(false);
        loadLesson();
    };

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: headerScale.value }],
    }));

    if (!currentLesson) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Loading lesson...</Text>
            </SafeAreaView>
        );
    }

    const remainingTargets = targetSquares.length - collectedSquares.length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerEmoji}>{pieceEmojis[pieceType]}</Text>
                    <Text style={styles.headerTitle}>{currentLesson.title}</Text>
                </View>

                <View style={styles.mistakesContainer}>
                    <Text style={styles.mistakesText}>❌ {mistakes}</Text>
                </View>
            </Animated.View>

            {/* Instruction */}
            <Animated.View
                entering={FadeInDown.delay(200)}
                style={styles.instructionContainer}
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.instructionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.instruction}>{currentLesson.instruction}</Text>
                    <View style={styles.progressIndicator}>
                        <Text style={styles.progressText}>
                            🍫 {remainingTargets} {remainingTargets === 1 ? 'treat' : 'treats'} left!
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Chess Board */}
            <Animated.View entering={FadeIn.delay(400)}>
                <ChessBoard
                    piecePosition={piecePosition}
                    pieceSymbol={pieceSymbols[pieceType]}
                    highlightedSquares={validMoves}
                    rewardSquares={targetSquares}
                    collectedSquares={collectedSquares}
                    onSquarePress={handleSquarePress}
                />
            </Animated.View>

            {/* Help text */}
            <Text style={styles.helpText}>
                Tap a highlighted square to move the {pieceType}!
            </Text>

            {/* Lesson Complete Overlay */}
            {lessonComplete && (
                <View style={styles.completeOverlay}>
                    <Animated.View
                        entering={FadeInDown}
                        style={styles.completeCard}
                    >
                        <Text style={styles.completeEmoji}>🎉</Text>
                        <Text style={styles.completeTitle}>Amazing!</Text>
                        <Text style={styles.completeSubtitle}>
                            You collected all the treats!
                        </Text>

                        {/* Stars */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3].map(star => (
                                <Text
                                    key={star}
                                    style={[
                                        styles.star,
                                        { opacity: mistakes < star ? 1 : 0.3 }
                                    ]}
                                >
                                    ⭐
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.xpEarned}>+{10 + (mistakes === 0 ? 25 : mistakes <= 2 ? 15 : 5)} XP</Text>

                        <Pressable onPress={handleNextLesson} style={styles.nextButton}>
                            <LinearGradient
                                colors={[colors.success, '#2ECC71']}
                                style={styles.nextButtonGradient}
                            >
                                <Text style={styles.nextButtonText}>Next Lesson →</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={onBack} style={styles.homeButton}>
                            <Text style={styles.homeButtonText}>Back to Home</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            )}

            {/* Reward Animation */}
            <RewardAnimation
                type={rewardType}
                visible={showReward && !lessonComplete}
                onComplete={() => setShowReward(false)}
            />

            {/* Confetti */}
            <ConfettiAnimation visible={showConfetti} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingText: {
        fontSize: fontSize.lg,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonText: {
        fontSize: fontSize.xl,
        color: colors.text,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: fontSize.xxl,
    },
    headerTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.text,
    },
    mistakesContainer: {
        backgroundColor: colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    mistakesText: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    instructionContainer: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    instructionGradient: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    instruction: {
        fontSize: fontSize.md,
        color: colors.white,
        textAlign: 'center',
        fontWeight: '500',
    },
    progressIndicator: {
        marginTop: spacing.sm,
        alignItems: 'center',
    },
    progressText: {
        fontSize: fontSize.sm,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    helpText: {
        textAlign: 'center',
        color: colors.textLight,
        fontSize: fontSize.sm,
        marginTop: spacing.md,
    },
    completeOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    completeCard: {
        backgroundColor: colors.white,
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    completeEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    completeTitle: {
        fontSize: fontSize.xxl,
        fontWeight: 'bold',
        color: colors.text,
    },
    completeSubtitle: {
        fontSize: fontSize.md,
        color: colors.textLight,
        marginTop: spacing.xs,
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: spacing.lg,
    },
    star: {
        fontSize: 40,
        marginHorizontal: spacing.xs,
    },
    xpEarned: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.success,
        marginTop: spacing.md,
    },
    nextButton: {
        marginTop: spacing.lg,
        width: '100%',
    },
    nextButtonGradient: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.white,
    },
    homeButton: {
        marginTop: spacing.md,
    },
    homeButtonText: {
        fontSize: fontSize.md,
        color: colors.textLight,
    },
});
