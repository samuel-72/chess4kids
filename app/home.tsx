import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    Image,
    Platform,
    useWindowDimensions,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore, PieceType } from '../stores/progressStore';
import { getLessonsForPiece } from '../utils/lessonGenerator';

import { PIECE_IMAGES, PIECE_LABELS } from '../constants/pieces';

const PIECES = (Object.keys(PIECE_IMAGES) as PieceType[]).map(type => ({
    type,
    label: PIECE_LABELS[type],
    image: PIECE_IMAGES[type],
}));

export default function HomeScreen() {
    const { user, logout } = useAuthStore();
    const { totalXP, level, getPieceStats, resetPieceProgress } = useProgressStore();
    const { width, height } = useWindowDimensions();
    const [showSettings, setShowSettings] = useState(false);

    const handlePiecePress = (piece: PieceType) => {
        router.push(`/lesson/${piece}`);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleResetPiece = (piece: PieceType, label: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Reset progress for ${label}?`)) {
                resetPieceProgress(piece);
            }
        } else {
            Alert.alert('Reset Progress', `Reset all progress for ${label}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => resetPieceProgress(piece) },
            ]);
        }
    };

    // Responsive grid
    const isMobile = width < 600;
    const horizontalPadding = isMobile ? 16 : 32;
    // On mobile, minimize gap to fit content better
    const gap = isMobile ? 12 : 16;

    // Calculate grid based on available space
    const availableWidth = width - horizontalPadding;

    // Determine optimal columns
    const minCardWidth = isMobile ? 120 : 150;
    const numColumns = Math.max(2, Math.min(6, Math.floor((availableWidth + gap) / (minCardWidth + gap))));

    // Calculate card size
    const cardWidth = (availableWidth - (gap * (numColumns - 1))) / numColumns;
    // Use fixed aspect ratio to ensure cards aren't squashed
    const cardHeight = cardWidth * 1.35;

    const firstName = user?.name?.split(' ')[0] || 'Champion';

    return (
        <View style={styles.container}>
            {/* Vibrant gradient background */}
            <LinearGradient
                colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {firstName}</Text>
                        <Text style={styles.stats}>Level {level} · {totalXP} XP</Text>
                    </View>
                    <Pressable
                        onPress={() => setShowSettings(true)}
                        style={styles.settingsBtn}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </Pressable>
                </Animated.View>

                {/* Piece Grid */}
                <ScrollView
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.grid, { gap }]}>
                        {PIECES.map((piece, index) => {
                            const stats = getPieceStats(piece.type);

                            return (
                                <Animated.View
                                    key={piece.type}
                                    entering={FadeInDown.delay(index * 80).springify()}
                                    style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}
                                >
                                    <Pressable
                                        onPress={() => handlePiecePress(piece.type)}
                                        style={({ pressed }) => [
                                            styles.card,
                                            pressed && styles.cardPressed
                                        ]}
                                    >
                                        {/* Liquid Glass Card */}
                                        <View style={styles.glassCard}>
                                            {/* Piece Image */}
                                            <Image
                                                source={piece.image}
                                                style={[styles.pieceImage, { width: cardWidth * 0.7, height: cardWidth * 0.7 }]}
                                                resizeMode="contain"
                                            />

                                            {/* Label */}
                                            <Text style={styles.pieceLabel}>{piece.label}</Text>

                                            {/* Stats Row */}
                                            <View style={styles.statsRow}>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Tasks</Text>
                                                    <Text style={styles.statValue}>{stats.count}</Text>
                                                </View>
                                                <View style={styles.statDivider} />
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Score</Text>
                                                    <Text style={styles.statValue}>{stats.score} ⭐</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Settings Modal */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)} />
                    <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Settings</Text>

                        <ScrollView style={styles.modalScroll}>
                            {PIECES.map((piece) => {
                                const stats = getPieceStats(piece.type);
                                return (
                                    <Pressable
                                        key={piece.type}
                                        style={styles.resetRow}
                                        onPress={() => handleResetPiece(piece.type, piece.label)}
                                    >
                                        <Image source={piece.image} style={styles.resetImage} resizeMode="contain" />
                                        <Text style={styles.resetLabel}>{piece.label}</Text>
                                        <Text style={styles.resetCount}>{stats.count}</Text>
                                        <Text style={styles.resetIcon}>↺</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </Pressable>

                        <Pressable style={styles.closeBtn} onPress={() => setShowSettings(false)}>
                            <Text style={styles.closeText}>Done</Text>
                        </Pressable>
                    </Animated.View>
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
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 48 : 16,
        paddingBottom: 12,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    stats: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        marginTop: 2,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    settingsIcon: {
        fontSize: 20,
    },
    // Grid
    gridContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        alignItems: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    cardWrapper: {
        marginBottom: 4,
    },
    card: {
        flex: 1,
        borderRadius: 28,
        overflow: 'hidden',
    },
    cardPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.95,
    },
    // Liquid Glass Effect
    glassCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        overflow: 'hidden',
        // Glow shadow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    pieceImage: {
        zIndex: 1,
        borderRadius: 12,
    },
    pieceLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        zIndex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 8,
        marginTop: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 28,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalScroll: {
        maxHeight: 280,
    },
    resetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    resetImage: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    resetLabel: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a2e',
        fontWeight: '600',
    },
    resetCount: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
        backgroundColor: 'rgba(74,222,128,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    resetIcon: {
        fontSize: 20,
        color: '#999',
    },
    logoutBtn: {
        backgroundColor: '#fee2e2',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        color: '#dc2626',
        fontWeight: '600',
    },
    closeBtn: {
        backgroundColor: '#1a2a6c',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    closeText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
