import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Pressable,
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore, PieceType } from '../stores/progressStore';
import { PieceTile } from '../components/PieceTile';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getLessonsForPiece } from '../utils/lessonGenerator';

const PIECES: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

interface HomeScreenProps {
    onSelectPiece: (piece: PieceType) => void;
    onLogout: () => void;
}

export default function HomeScreen({ onSelectPiece, onLogout }: HomeScreenProps) {
    const { user, logout } = useAuthStore();
    const { totalXP, level, streak, lessonsCompleted, getTotalCompletedLessons } = useProgressStore();
    const totalCompleted = useMemo(() => getTotalCompletedLessons(), [lessonsCompleted]);

    // Preload lessons
    const lessonCounts = useMemo(() => {
        const counts: Record<PieceType, { completed: number; total: number }> = {} as any;
        PIECES.forEach(piece => {
            const lessons = getLessonsForPiece(piece);
            counts[piece] = {
                completed: lessonsCompleted[piece]?.length || 0,
                total: lessons.length,
            };
        });
        return counts;
    }, [lessonsCompleted]);

    const handlePiecePress = (piece: PieceType) => {
        onSelectPiece(piece);
    };

    const handleLogout = () => {
        logout();
        onLogout();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>Hello, {user?.name || 'Champion'}! 👋</Text>
                            <Text style={styles.subGreeting}>Ready to learn some chess?</Text>
                        </View>
                        <Pressable onPress={handleLogout} style={styles.logoutButton}>
                            <Text style={styles.logoutText}>👋</Text>
                        </Pressable>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatBadge icon="⭐" value={totalXP} label="XP" />
                        <StatBadge icon="🏆" value={level} label="Level" />
                        <StatBadge icon="🔥" value={streak} label="Streak" />
                        <StatBadge icon="📚" value={totalCompleted} label="Lessons" />
                    </View>
                </LinearGradient>

                {/* Level Progress */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.progressSection}
                >
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.levelCard}>
                        <Text style={styles.levelLabel}>Level {level}</Text>
                        <View style={styles.levelProgress}>
                            <View
                                style={[
                                    styles.levelProgressFill,
                                    { width: `${(totalXP % 100)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.xpLabel}>{totalXP % 100}/100 XP to next level</Text>
                    </View>
                </Animated.View>

                {/* Piece Selection */}
                <Animated.View
                    entering={FadeInDown.delay(400)}
                    style={styles.pieceSection}
                >
                    <Text style={styles.sectionTitle}>Choose Your Piece 🎯</Text>
                    <Text style={styles.sectionSubtitle}>Tap a piece to start learning!</Text>

                    <View style={styles.pieceGrid}>
                        {PIECES.map((piece, index) => (
                            <Animated.View
                                key={piece}
                                entering={FadeInDown.delay(500 + index * 100)}
                            >
                                <PieceTile
                                    piece={piece}
                                    completedLessons={lessonCounts[piece].completed}
                                    totalLessons={lessonCounts[piece].total}
                                    onPress={() => handlePiecePress(piece)}
                                />
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface StatBadgeProps {
    icon: string;
    value: number;
    label: string;
}

function StatBadge({ icon, value, label }: StatBadgeProps) {
    return (
        <View style={styles.statBadge}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing.md,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    greeting: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.white,
    },
    subGreeting: {
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: spacing.xs,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: fontSize.xl,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: spacing.sm,
    },
    statBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        minWidth: 70,
    },
    statIcon: {
        fontSize: fontSize.lg,
    },
    statValue: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.white,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    progressSection: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textLight,
        marginBottom: spacing.md,
    },
    levelCard: {
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    levelLabel: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    levelProgress: {
        height: 12,
        backgroundColor: colors.boardLight,
        borderRadius: 6,
        overflow: 'hidden',
    },
    levelProgressFill: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: 6,
    },
    xpLabel: {
        fontSize: fontSize.sm,
        color: colors.textLight,
        marginTop: spacing.sm,
        textAlign: 'right',
    },
    pieceSection: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    pieceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
});
