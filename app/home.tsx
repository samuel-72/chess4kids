import React, { useMemo } from 'react';
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
    const { totalXP, level, streak, lessonsCompleted } = useProgressStore();
    const { width } = useWindowDimensions();

    const handlePiecePress = (piece: PieceType) => {
        router.push(`/lesson/${piece}`);
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
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
                    <Pressable onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>🚪 Log Out</Text>
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
});
