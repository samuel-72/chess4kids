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
import { BlurView } from 'expo-blur';

const PIECES: { type: PieceType; label: string; image: any }[] = [
    { type: 'pawn', label: 'Pawn', image: require('../assets/pieces/pawn.png') },
    { type: 'knight', label: 'Knight', image: require('../assets/pieces/knight.png') },
    { type: 'bishop', label: 'Bishop', image: require('../assets/pieces/bishop.png') },
    { type: 'rook', label: 'Rook', image: require('../assets/pieces/rook.png') },
    { type: 'queen', label: 'Queen', image: require('../assets/pieces/queen.png') },
    { type: 'king', label: 'King', image: require('../assets/pieces/king.png') },
];

export default function HomeScreen() {
    const { user, logout } = useAuthStore();
    const { totalXP, level, lessonsCompleted, resetPieceProgress } = useProgressStore();
    const { width, height } = useWindowDimensions();
    const [showSettings, setShowSettings] = useState(false);

    const handlePiecePress = (piece: PieceType) => {
        router.push(`/lesson/${piece}`);
    };

    const handleLogout = () => {
        logout();
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
    const isWide = width > 700;
    const numColumns = isWide ? 3 : 2;
    const cardSize = isWide ? (width - 120) / 3 : (width - 60) / 2;

    const firstName = user?.name?.split(' ')[0] || 'Champion';

    return (
        <View style={styles.container}>
            {/* Soft gradient background */}
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={StyleSheet.absoluteFill}
            />

            {/* Subtle animated orbs for depth */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />

            <SafeAreaView style={styles.safeArea}>
                {/* Minimal Header */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
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
                    <View style={[styles.grid, { maxWidth: isWide ? 900 : 500 }]}>
                        {PIECES.map((piece, index) => {
                            const completed = lessonsCompleted[piece.type]?.length || 0;
                            const total = getLessonsForPiece(piece.type).length;
                            const progress = total > 0 ? completed / total : 0;

                            return (
                                <Animated.View
                                    key={piece.type}
                                    entering={FadeInDown.delay(index * 80).springify()}
                                    style={[styles.cardWrapper, { width: cardSize, height: cardSize * 1.1 }]}
                                >
                                    <Pressable
                                        onPress={() => handlePiecePress(piece.type)}
                                        style={({ pressed }) => [
                                            styles.card,
                                            pressed && styles.cardPressed
                                        ]}
                                    >
                                        {/* Glass effect */}
                                        <View style={styles.glassCard}>
                                            {/* Piece Image */}
                                            <Image
                                                source={piece.image}
                                                style={[styles.pieceImage, { width: cardSize * 0.55, height: cardSize * 0.55 }]}
                                                resizeMode="contain"
                                            />

                                            {/* Label */}
                                            <Text style={styles.pieceLabel}>{piece.label}</Text>

                                            {/* Progress indicator */}
                                            <View style={styles.progressContainer}>
                                                <View style={styles.progressTrack}>
                                                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                                                </View>
                                                <Text style={styles.progressText}>{completed}/{total}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Settings Modal - Frosted Glass Style */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)} />
                    <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Settings</Text>

                        <ScrollView style={styles.modalScroll}>
                            {PIECES.map((piece) => {
                                const count = lessonsCompleted[piece.type]?.length || 0;
                                return (
                                    <Pressable
                                        key={piece.type}
                                        style={styles.resetRow}
                                        onPress={() => handleResetPiece(piece.type, piece.label)}
                                    >
                                        <Image source={piece.image} style={styles.resetImage} resizeMode="contain" />
                                        <Text style={styles.resetLabel}>{piece.label}</Text>
                                        <Text style={styles.resetCount}>{count}</Text>
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
        backgroundColor: '#0f0c29',
    },
    // Decorative orbs for depth
    orb: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.15,
    },
    orb1: {
        width: 400,
        height: 400,
        backgroundColor: '#667eea',
        top: -100,
        right: -100,
    },
    orb2: {
        width: 300,
        height: 300,
        backgroundColor: '#764ba2',
        bottom: 100,
        left: -80,
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
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    stats: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        marginTop: 2,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        fontSize: 20,
    },
    // Grid
    gridContainer: {
        paddingHorizontal: 20,
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
        marginBottom: 8,
    },
    card: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.9,
    },
    glassCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        // Glass blur effect via shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
    },
    pieceImage: {
        marginBottom: 8,
    },
    pieceLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressTrack: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4ade80',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: 'rgba(30,30,50,0.95)',
        borderRadius: 28,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalScroll: {
        maxHeight: 280,
    },
    resetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
    },
    resetImage: {
        width: 36,
        height: 36,
        marginRight: 12,
    },
    resetLabel: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
    },
    resetCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginRight: 12,
        backgroundColor: 'rgba(74,222,128,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    resetIcon: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.4)',
    },
    logoutBtn: {
        backgroundColor: 'rgba(239,68,68,0.2)',
        borderRadius: 14,
        padding: 14,
        marginTop: 16,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 15,
        color: '#ef4444',
        fontWeight: '600',
    },
    closeBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: 14,
        marginTop: 8,
        alignItems: 'center',
    },
    closeText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
});
