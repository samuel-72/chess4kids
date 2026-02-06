import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    Image,
    FlatList,
    Platform,
    useWindowDimensions,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore, PieceType } from '../stores/progressStore';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { getLessonsForPiece } from '../utils/lessonGenerator';
import { BlurView } from 'expo-blur';

const PIECES: { type: PieceType; label: string; image?: any; emoji: string }[] = [
    { type: 'pawn', label: 'A Brave Pawn', image: require('../assets/pieces/pawn.png'), emoji: '♟️' },
    { type: 'knight', label: 'A Majestic Knight', image: require('../assets/pieces/knight.png'), emoji: '♞' },
    { type: 'bishop', label: 'A Wise Wizard', emoji: '🧙‍♂️' },
    { type: 'rook', label: 'A Strong Castle', emoji: '🏰' },
    { type: 'queen', label: 'A Mighty Queen', emoji: '👑' },
    { type: 'king', label: 'A Royal King', emoji: '🤴' },
];

export default function HomeScreen() {
    const { user, logout } = useAuthStore();
    const { totalXP, level, streak, lessonsCompleted, resetPieceProgress } = useProgressStore();
    const { width } = useWindowDimensions();

    const handlePiecePress = (piece: PieceType) => {
        router.push(`/lesson/${piece}`);
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    // Settings modal state
    const [showSettings, setShowSettings] = useState(false);

    const handleResetPiece = (piece: PieceType, label: string) => {
        Alert.alert(
            'Reset Progress',
            `Are you sure you want to reset all progress for ${label}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => resetPieceProgress(piece),
                },
            ]
        );
    };

    // Calculate columns based on width
    const numColumns = width > 600 ? 3 : 2;

    const renderPieceItem = ({ item, index }: { item: typeof PIECES[0], index: number }) => {
        const completedCount = lessonsCompleted[item.type]?.length || 0;
        const totalCount = getLessonsForPiece(item.type).length;
        const isCompleted = completedCount === totalCount && totalCount > 0;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={[styles.gridItem, { width: (width - 48) / numColumns - 10 }]}
            >
                <Pressable
                    onPress={() => handlePiecePress(item.type)}
                    style={({ pressed }) => [
                        styles.pieceCard,
                        pressed && styles.pieceCardPressed
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconContainer}>
                            {item.image ? (
                                <Image source={item.image} style={styles.pieceImage} resizeMode="contain" />
                            ) : (
                                <Text style={styles.pieceEmoji}>{item.emoji}</Text>
                            )}
                        </View>

                        <View style={styles.cardContent}>
                            <Text style={styles.pieceLabel}>{item.label}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{completedCount}/{totalCount} Learned</Text>
                        </View>
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hi, {user?.name || 'Champion'}!</Text>
                        <Text style={styles.subGreeting}>Level {level} • {totalXP} XP</Text>
                    </View>
                    <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </Pressable>
                </View>

                {/* Grid */}
                <FlatList
                    data={PIECES}
                    renderItem={renderPieceItem}
                    keyExtractor={item => item.type}
                    numColumns={numColumns}
                    key={numColumns} // Force re-render on orientation change
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>Choose Your Warrior</Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* Settings Modal */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⚙️ Settings</Text>

                        <Text style={styles.modalSectionTitle}>Reset Progress Per Piece</Text>
                        <ScrollView style={styles.resetList}>
                            {PIECES.map((piece) => {
                                const count = lessonsCompleted[piece.type]?.length || 0;
                                return (
                                    <Pressable
                                        key={piece.type}
                                        style={styles.resetRow}
                                        onPress={() => handleResetPiece(piece.type, piece.label)}
                                    >
                                        <Text style={styles.resetPieceLabel}>{piece.emoji} {piece.label}</Text>
                                        <View style={styles.resetBadge}>
                                            <Text style={styles.resetBadgeText}>{count} done</Text>
                                        </View>
                                        <Text style={styles.resetBtn}>🗑️</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <Pressable style={styles.logoutRow} onPress={handleLogout}>
                            <Text style={styles.logoutRowText}>🚪 Log Out</Text>
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={() => setShowSettings(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: Platform.OS === 'android' ? 40 : spacing.md,
        paddingBottom: spacing.lg,
    },
    greeting: {
        fontSize: fontSize.xxl,
        fontWeight: 'bold',
        color: colors.white,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subGreeting: {
        fontSize: fontSize.md,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    logoutButton: {
        paddingHorizontal: spacing.md,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: fontSize.sm,
        color: colors.white,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    listHeader: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: spacing.md,
    },
    gridItem: {
        marginBottom: spacing.lg,
    },
    pieceCard: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        height: 200,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    pieceCardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    cardGradient: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    pieceImage: {
        width: 100,
        height: 100,
    },
    pieceEmoji: {
        fontSize: 80,
    },
    cardContent: {
        width: '100%',
        alignItems: 'center',
        gap: spacing.xs,
    },
    pieceLabel: {
        fontSize: fontSize.md,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    progressText: {
        fontSize: fontSize.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    // Settings button (replaces logout button in header)
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        fontSize: 24,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#1a2a6c',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalSectionTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: spacing.md,
    },
    resetList: {
        maxHeight: 300,
    },
    resetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    resetPieceLabel: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.white,
    },
    resetBadge: {
        backgroundColor: 'rgba(76,175,80,0.3)',
        borderRadius: 12,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        marginRight: spacing.sm,
    },
    resetBadgeText: {
        fontSize: fontSize.xs,
        color: '#4CAF50',
    },
    resetBtn: {
        fontSize: 20,
    },
    logoutRow: {
        backgroundColor: 'rgba(255,87,51,0.2)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.md,
        alignItems: 'center',
    },
    logoutRowText: {
        fontSize: fontSize.md,
        color: '#ff5733',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.md,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: fontSize.md,
        color: '#1a2a6c',
        fontWeight: 'bold',
    },
});
