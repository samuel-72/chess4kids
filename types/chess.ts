/**
 * Shared type definitions for chess pieces.
 * Kept in a standalone file with zero dependencies to enable
 * testing without pulling in React Native / Expo / Zustand.
 */

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

/** All valid piece types as an array (useful for iteration/validation). */
export const PIECE_TYPES: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

/** Game modes available in lessons. */
export type GameMode = 'practice' | 'fastest_finger';
