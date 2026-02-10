import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PieceType, GameMode } from '../../types/chess';
import { useGameScenarios } from '../../hooks/useGameScenarios';
import { useGameLogic } from '../../hooks/useGameLogic';
import { LessonModeSelect } from '../../components/lesson/LessonModeSelect';
import { LessonComplete } from '../../components/lesson/LessonComplete';
import { LessonGame } from '../../components/lesson/LessonGame';

export default function LessonScreen() {
    const router = useRouter();
    const { piece: pieceParam } = useLocalSearchParams<{ piece: PieceType }>();
    const piece = (Array.isArray(pieceParam) ? pieceParam[0] : pieceParam) as PieceType;

    const onBack = () => router.back();

    // Game mode selection
    const [gameMode, setGameMode] = useState<GameMode | null>(null);

    // Game Logic Hook
    const { generateScenario } = useGameScenarios(piece);
    const {
        scenario,
        score,
        foundMoves,
        wrongGuesses,
        targetMoves,
        message,
        messageType,
        showCelebration,
        lessonComplete,
        surpriseReward,
        starRating,
        handleSquareTap
    } = useGameLogic(piece, gameMode, generateScenario);

    if (gameMode === null) {
        return <LessonModeSelect piece={piece} onSelectMode={setGameMode} onBack={onBack} />;
    }

    if (lessonComplete) {
        return <LessonComplete reward={surpriseReward} score={starRating} onBack={onBack} />;
    }

    return (
        <LessonGame
            piece={piece}
            gameMode={gameMode}
            scenario={scenario}
            score={score}
            foundMoves={foundMoves}
            targetMoves={targetMoves}
            wrongGuesses={wrongGuesses}
            message={message}
            messageType={messageType}
            onSquareTap={handleSquareTap}
            onBack={onBack}
            showCelebration={showCelebration}
            surpriseReward={surpriseReward}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});

