import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface LessonProgress {
    lessonId: string;
    pieceType: PieceType;
    completedAt: number;
    score: number; // 0-3 stars based on mistakes
    timeSpent: number; // in seconds
}

export interface UserProgress {
    totalXP: number;
    level: number;
    streak: number;
    lastPlayedAt: number;
    lessonsCompleted: Record<PieceType, string[]>; // piece -> lessonIds completed
    lessonHistory: LessonProgress[];
}

interface ProgressState extends UserProgress {
    // Actions
    completeLesson: (lesson: LessonProgress) => void;
    addXP: (amount: number) => void;
    updateStreak: () => void;
    resetProgress: () => void;
    getCompletedLessonsForPiece: (piece: PieceType) => string[];
    getTotalCompletedLessons: () => number;
}

const INITIAL_STATE: UserProgress = {
    totalXP: 0,
    level: 1,
    streak: 0,
    lastPlayedAt: 0,
    lessonsCompleted: {
        pawn: [],
        knight: [],
        bishop: [],
        rook: [],
        queen: [],
        king: [],
    },
    lessonHistory: [],
};

// XP needed for each level
const XP_PER_LEVEL = 100;

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,

            completeLesson: (lesson: LessonProgress) => {
                const state = get();
                const pieceCompleted = [...state.lessonsCompleted[lesson.pieceType]];

                // Only add if not already completed
                if (!pieceCompleted.includes(lesson.lessonId)) {
                    pieceCompleted.push(lesson.lessonId);
                }

                // Calculate XP based on stars
                const baseXP = 10;
                const bonusXP = lesson.score * 5; // 0-15 bonus based on stars
                const totalXP = state.totalXP + baseXP + bonusXP;
                const newLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;

                set({
                    lessonsCompleted: {
                        ...state.lessonsCompleted,
                        [lesson.pieceType]: pieceCompleted,
                    },
                    lessonHistory: [...state.lessonHistory, lesson],
                    totalXP,
                    level: newLevel,
                    lastPlayedAt: Date.now(),
                });
            },

            addXP: (amount: number) => {
                const state = get();
                const totalXP = state.totalXP + amount;
                const newLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;
                set({ totalXP, level: newLevel });
            },

            updateStreak: () => {
                const state = get();
                const now = Date.now();
                const oneDayMs = 24 * 60 * 60 * 1000;
                const lastPlayed = state.lastPlayedAt;

                if (now - lastPlayed > oneDayMs * 2) {
                    // Streak broken - more than 2 days
                    set({ streak: 1, lastPlayedAt: now });
                } else if (now - lastPlayed > oneDayMs) {
                    // Next day - increment streak
                    set({ streak: state.streak + 1, lastPlayedAt: now });
                }
                // Same day - no change to streak
            },

            resetProgress: () => set(INITIAL_STATE),

            getCompletedLessonsForPiece: (piece: PieceType) => {
                return get().lessonsCompleted[piece];
            },

            getTotalCompletedLessons: () => {
                const state = get();
                return Object.values(state.lessonsCompleted).reduce(
                    (sum, lessons) => sum + lessons.length,
                    0
                );
            },
        }),
        {
            name: 'chess-kids-progress',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
