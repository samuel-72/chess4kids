import { ImageSourcePropType } from 'react-native';
import { PieceType } from '../types/chess';

export const PIECE_INFO: Record<PieceType, { emoji: string; name: string; color: string; hint: string }> = {
    pawn: { emoji: '♟', name: 'Pawn', color: '#4CAF50', hint: 'Pawns move 1 step forward!' },
    knight: { emoji: '♞', name: 'Knight', color: '#FF9800', hint: 'Knights jump in an L shape!' },
    bishop: { emoji: '♝', name: 'Bishop', color: '#9C27B0', hint: 'Bishops zoom diagonally!' },
    rook: { emoji: '♜', name: 'Rook', color: '#2196F3', hint: 'Rooks move straight lines!' },
    queen: { emoji: '♛', name: 'Queen', color: '#E91E63', hint: 'Queen goes anywhere she wants!' },
    king: { emoji: '♚', name: 'King', color: '#FFD700', hint: 'Kings move one step in any direction (except for castling!).' },
};

export const SURPRISE_REWARDS = [
    { emoji: '🍫', name: 'Chocolate Bar!' },
    { emoji: '🦄', name: 'Magical Unicorn!' },
    { emoji: '🦕', name: 'Friendly Dinosaur!' },
    { emoji: '🎁', name: 'Mystery Gift!' },
    { emoji: '👑', name: 'Golden Crown!' },
];

export const REAL_PIECES: Record<PieceType, ImageSourcePropType> = {
    pawn: require('../assets/standard_pieces/pawn.png'),
    knight: require('../assets/standard_pieces/knight.png'),
    bishop: require('../assets/standard_pieces/bishop.png'),
    rook: require('../assets/standard_pieces/rook.png'),
    queen: require('../assets/standard_pieces/queen.png'),
    king: require('../assets/standard_pieces/king.png'),
};
