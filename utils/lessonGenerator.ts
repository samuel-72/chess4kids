import { PieceType } from '../stores/progressStore';
import { getValidMoves, positionToSquare, Square } from './chessLogic';

export interface Lesson {
    id: string;
    pieceType: PieceType;
    title: string;
    instruction: string;
    startPosition: Square;
    targetSquares: Square[]; // Squares the child needs to move to
    difficulty: number; // 1-5
    rewardType: 'chocolate' | 'star' | 'cookie' | 'candy';
}

// Generate lessons for a piece
// We'll create 100 unique lessons per piece with varying difficulty
export function generateLessonsForPiece(pieceType: PieceType): Lesson[] {
    const lessons: Lesson[] = [];

    // All possible starting positions
    const allPositions: Square[] = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            allPositions.push(positionToSquare({ row, col }));
        }
    }

    // Shuffle positions to get variety
    const shuffledPositions = shuffleArray([...allPositions]);

    // Generate 100 lessons with varying difficulty
    for (let i = 0; i < 100; i++) {
        const difficulty = Math.min(5, Math.floor(i / 20) + 1); // Difficulty increases every 20 lessons
        const startPosition = shuffledPositions[i % shuffledPositions.length];
        const validMoves = getValidMoves(pieceType, startPosition);

        // Skip if no valid moves from this position
        if (validMoves.length === 0) continue;

        // For easier lessons, require fewer targets
        // For harder lessons, require more targets
        const numTargets = Math.min(validMoves.length, Math.ceil(difficulty * 1.5));
        const targetSquares = shuffleArray(validMoves).slice(0, numTargets);

        const lesson: Lesson = {
            id: `${pieceType}-lesson-${i + 1}`,
            pieceType,
            title: getLessonTitle(pieceType, i + 1, difficulty),
            instruction: getLessonInstruction(pieceType, targetSquares.length),
            startPosition,
            targetSquares,
            difficulty,
            rewardType: getRewardType(difficulty),
        };

        lessons.push(lesson);
    }

    return lessons;
}

function getLessonTitle(piece: PieceType, lessonNum: number, difficulty: number): string {
    const titles: Record<PieceType, string[]> = {
        pawn: ['Pawn Steps', 'Forward March', 'Pawn Power', 'Little Soldier', 'Pawn Patrol'],
        knight: ['Horse Jump', 'L-Shape Fun', 'Knight Hop', 'Jumping Joy', 'Knight Adventure'],
        bishop: ['Diagonal Dash', 'Slippery Slide', 'Bishop Zoom', 'Corner Chase', 'Diagonal Dream'],
        rook: ['Tower Power', 'Straight Shot', 'Rook Rush', 'Castle Cruise', 'Tower Time'],
        queen: ['Queen Quest', 'Royal Moves', 'Queen Power', 'Mighty Queen', 'Royal Adventure'],
        king: ['King Steps', 'Royal Walk', 'King Care', 'Gentle King', 'King Stroll'],
    };

    const piecesTitles = titles[piece];
    const titleIndex = (lessonNum - 1) % piecesTitles.length;
    return `${piecesTitles[titleIndex]} ${lessonNum}`;
}

function getLessonInstruction(piece: PieceType, numTargets: number): string {
    const instructions: Record<PieceType, string> = {
        pawn: 'Move the pawn to collect the treats!',
        knight: 'Make the horse jump to get all the chocolates!',
        bishop: 'Slide diagonally to grab the goodies!',
        rook: 'Move straight to collect the rewards!',
        queen: 'The queen can go anywhere! Get all the treats!',
        king: 'Move the king one step at a time to collect rewards!',
    };

    return instructions[piece] + ` (${numTargets} ${numTargets === 1 ? 'treat' : 'treats'} to collect!)`;
}

function getRewardType(difficulty: number): 'chocolate' | 'star' | 'cookie' | 'candy' {
    const rewards: ('chocolate' | 'star' | 'cookie' | 'candy')[] = ['chocolate', 'star', 'cookie', 'candy'];
    return rewards[difficulty % rewards.length];
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get a lesson that hasn't been completed yet, prioritizing uncompleted ones
export function getNextLesson(
    pieceType: PieceType,
    completedLessonIds: string[],
    allLessons: Lesson[]
): Lesson | null {
    // Filter lessons for this piece
    const pieceLessons = allLessons.filter(l => l.pieceType === pieceType);

    // Separate into completed and uncompleted
    const uncompleted = pieceLessons.filter(l => !completedLessonIds.includes(l.id));
    const completed = pieceLessons.filter(l => completedLessonIds.includes(l.id));

    // Prioritize uncompleted lessons
    if (uncompleted.length > 0) {
        // Return a random uncompleted lesson
        return uncompleted[Math.floor(Math.random() * uncompleted.length)];
    }

    // If all completed, return a random completed one for practice
    if (completed.length > 0) {
        return completed[Math.floor(Math.random() * completed.length)];
    }

    return null;
}

// Create a cache for generated lessons
const lessonCache: Record<PieceType, Lesson[]> = {
    pawn: [],
    knight: [],
    bishop: [],
    rook: [],
    queen: [],
    king: [],
};

export function getLessonsForPiece(pieceType: PieceType): Lesson[] {
    if (lessonCache[pieceType].length === 0) {
        lessonCache[pieceType] = generateLessonsForPiece(pieceType);
    }
    return lessonCache[pieceType];
}
