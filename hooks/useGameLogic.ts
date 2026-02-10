import { useState, useEffect, useRef } from 'react';
import { useProgressStore } from '../stores/progressStore';
import { PieceType, GameMode } from '../types/chess';
import { getValidMoves, positionToSquare, Position } from '../utils/chessLogic';
import { SoundEffects } from '../utils/soundEffects';
import { Scenario } from './useGameScenarios';
import { SURPRISE_REWARDS } from '../constants/gameData';

export function useGameLogic(
    piece: PieceType,
    gameMode: GameMode | null,
    generateScenario: (round: number) => Scenario
) {
    const [scenario, setScenario] = useState<Scenario>(() => generateScenario(1));
    const { piecePos: piecePosition, enemies, friendlies, enPassantTarget, hint } = scenario;

    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [targetMoves, setTargetMoves] = useState<string[]>([]);
    const [foundMoves, setFoundMoves] = useState<Set<string>>(new Set());
    const [wrongGuesses, setWrongGuesses] = useState<Set<string>>(new Set());
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lessonComplete, setLessonComplete] = useState(false);
    const [surpriseReward, setSurpriseReward] = useState(SURPRISE_REWARDS[0]);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'hint' | 'error'>('hint');
    const [starRating, setStarRating] = useState(3);

    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);

    const completeLesson = useProgressStore(state => state.completeLesson);
    const startTime = useRef(Date.now());
    const moveStartTime = useRef(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Hint
    useEffect(() => {
        if (hint && gameMode) {
            setMessage(hint);
            setMessageType('hint');
            setTimeout(() => setMessage(''), 3000);
        }
    }, [hint, gameMode]);

    // Timer Logic
    useEffect(() => {
        if (gameMode === 'fastest_finger' && isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 100);
            }, 100);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameMode, isTimerRunning]);

    // Calculate Valid Moves
    useEffect(() => {
        if (gameMode) {
            const square = positionToSquare(piecePosition);
            const moves = getValidMoves(piece, square, enemies, friendlies, enPassantTarget);
            setValidMoves(moves);
            setTargetMoves(moves);
            setFoundMoves(new Set());
            setWrongGuesses(new Set());
            moveStartTime.current = Date.now();

            if (gameMode === 'fastest_finger' && round === 1) {
                setIsTimerRunning(true);
            }
        }
    }, [piecePosition, enemies, friendlies, enPassantTarget, piece, gameMode]);

    // Check Round Completion
    useEffect(() => {
        const goal = targetMoves.length;
        if (gameMode && targetMoves.length > 0 && foundMoves.size >= goal) {
            handleRoundComplete();
        }
    }, [foundMoves, targetMoves]);

    const handleRoundComplete = () => {
        setShowCelebration(true);
        SoundEffects.celebrate();

        const reward = SURPRISE_REWARDS[Math.floor(Math.random() * SURPRISE_REWARDS.length)];
        setSurpriseReward(reward);

        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        const stars = wrongGuesses.size === 0 ? 3 : wrongGuesses.size < 3 ? 2 : 1;
        setStarRating(stars);

        if (gameMode === 'fastest_finger') {
            if (!bestTime || timer < bestTime) {
                setBestTime(timer);
            }
        }

        completeLesson({
            lessonId: `${piece}-${gameMode}-${Date.now()}`,
            pieceType: piece,
            completedAt: Date.now(),
            score: stars,
            timeSpent,
        });

        if (round >= 6) {
            setIsTimerRunning(false);
            setTimeout(() => {
                setShowCelebration(false);
                setLessonComplete(true);
            }, 2000);
        } else {
            setTimeout(() => {
                setShowCelebration(false);
                setRound(prev => prev + 1);

                let newScenario = generateScenario(round + 1);
                // Simple retry to avoid identical position
                if (round + 1 > 5 && newScenario.piecePos.row === piecePosition.row && newScenario.piecePos.col === piecePosition.col) {
                    newScenario = generateScenario(round + 1);
                }
                setScenario(newScenario);

                setMessage(`Round ${round + 1}!`);
                setMessageType('hint');
                setTimeout(() => setMessage(''), 1500);
            }, 2000);
        }
    };

    const handleSquareTap = (row: number, col: number) => {
        const targetSquare = positionToSquare({ row, col });

        if (piecePosition.row === row && piecePosition.col === col) return;
        if (foundMoves.has(targetSquare)) {
            setMessage('Already found! 👀');
            setMessageType('hint');
            setTimeout(() => setMessage(''), 1000);
            return;
        }
        if (wrongGuesses.has(targetSquare)) return;

        if (validMoves.includes(targetSquare)) {
            // Correct
            const newFound = new Set(foundMoves);
            newFound.add(targetSquare);
            setFoundMoves(newFound);

            let pointsEarned = 10;
            if (gameMode === 'fastest_finger') {
                const moveTime = Date.now() - moveStartTime.current;
                if (moveTime < 1000) pointsEarned += 10;
                else if (moveTime < 2000) pointsEarned += 5;
                moveStartTime.current = Date.now();
            }

            setScore(prev => prev + pointsEarned);
            SoundEffects.move();

            const remaining = targetMoves.length - newFound.size;

            if (remaining > 0) {
                // Check Castle Animation
                if (piece === 'king' && Math.abs(piecePosition.col - col) > 1) {
                    setMessage('Castle! 🏰');
                    const isShort = col > piecePosition.col;
                    const rookSrcCol = isShort ? 7 : 0;
                    const rookDstCol = isShort ? 5 : 3;
                    const kingRow = piecePosition.row;

                    setScenario(prev => ({
                        ...prev,
                        friendlies: prev.friendlies.map(p =>
                            (p.row === kingRow && p.col === rookSrcCol && p.type === 'rook')
                                ? { ...p, col: rookDstCol }
                                : p
                        ),
                        piecePos: { row: kingRow, col: col }
                    }));
                } else {
                    setMessage(`+${pointsEarned} points! ${remaining} left!`);
                }
                setMessageType('success');
            } else {
                setMessage('🎉');
                setMessageType('success');
            }
            setTimeout(() => setMessage(''), 1000);

        } else {
            // Wrong
            const newWrong = new Set(wrongGuesses);
            newWrong.add(targetSquare);
            setWrongGuesses(newWrong);

            if (gameMode === 'fastest_finger') {
                setTimer(prev => prev + 2000);
            }

            SoundEffects.error();
            setMessage('Oops! +2s penalty');
            setMessageType('error');
            setTimeout(() => setMessage(''), 1500);
        }
    };

    return {
        scenario,
        score,
        round,
        foundMoves,
        wrongGuesses,
        validMoves,
        targetMoves,
        message,
        messageType,
        showCelebration,
        lessonComplete,
        surpriseReward,
        starRating,
        timer,
        handleSquareTap,
        // Expose setters if absolutely needed by UI (e.g. board size is UI state, not game state)
    };
}
