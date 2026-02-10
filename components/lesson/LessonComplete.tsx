import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

interface LessonCompleteProps {
    reward: { emoji: string; name: string };
    onBack: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({ reward, onBack }) => {
    return (
        <LinearGradient colors={['#6B4EE6', '#9C27B0', '#E91E63']} style={styles.container}>
            <SafeAreaView style={styles.completeContainer}>
                <Text style={styles.completeEmoji}>{reward.emoji}</Text>
                <Text style={styles.completeTitle}>Lesson Complete!</Text>
                <Text style={styles.completeSubtitle}>You earned a {reward.name}</Text>
                <Pressable style={styles.doneButton} onPress={onBack}>
                    <Text style={styles.doneButtonText}>🏠 Back to Home</Text>
                </Pressable>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    completeEmoji: { fontSize: 100, marginBottom: spacing.lg },
    completeTitle: { fontSize: fontSize.giant, fontWeight: 'bold', color: colors.white },
    completeSubtitle: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm },
    doneButton: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, marginTop: spacing.xl },
    doneButtonText: { color: '#6B4EE6', fontWeight: 'bold', fontSize: 18 },
});
