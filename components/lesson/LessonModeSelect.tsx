import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { PieceType, GameMode } from '../../types/chess';
import { PIECE_INFO } from '../../constants/gameData';
import { MoveTutorial } from '../MoveTutorial';

interface LessonModeSelectProps {
    piece: PieceType;
    onSelectMode: (mode: GameMode) => void;
    onBack: () => void;
}

export const LessonModeSelect: React.FC<LessonModeSelectProps> = ({ piece, onSelectMode, onBack }) => {
    const pieceInfo = PIECE_INFO[piece];

    return (
        <LinearGradient colors={[pieceInfo.color, colors.primaryDark]} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <Pressable onPress={onBack} style={styles.backButtonAbsolute} hitSlop={20}>
                    <Text style={[styles.backButtonText, { fontSize: 24 }]}>←</Text>
                </Pressable>
                <ScrollView contentContainerStyle={styles.modeSelectContainer} showsVerticalScrollIndicator={false}>
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
                        <Pressable style={styles.modeButton} onPress={() => onSelectMode('practice')}>
                            <Text style={styles.modeButtonEmoji}>📚</Text>
                            <Text style={styles.modeButtonTitle}>Learn Mode</Text>
                            <Text style={styles.modeButtonDesc}>Take your time</Text>
                        </Pressable>

                        <Pressable style={[styles.modeButton, styles.fastestFingerButton]} onPress={() => onSelectMode('fastest_finger')}>
                            <Text style={styles.modeButtonEmoji}>⚡</Text>
                            <Text style={styles.modeButtonTitle}>Fastest Finger</Text>
                            <Text style={styles.modeButtonDesc}>Speed Challenge!</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    modeSelectContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, paddingBottom: 50 },
    modeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white, marginBottom: spacing.sm, marginTop: 40 },
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
    backButtonAbsolute: { position: 'absolute', top: 20, left: 20, padding: spacing.sm, zIndex: 100 },
    backButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
