import { PieceType } from '../stores/progressStore';

export const PIECE_IMAGES: Record<PieceType, any> = {
    pawn: require('../assets/pieces/pawn.png'),
    knight: require('../assets/pieces/knight.png'),
    bishop: require('../assets/pieces/bishop.png'),
    rook: require('../assets/pieces/rook.png'),
    queen: require('../assets/pieces/queen.png'),
    king: require('../assets/pieces/king.png'),
};

export const PIECE_LABELS: Record<PieceType, string> = {
    pawn: 'Pawn',
    knight: 'Knight',
    bishop: 'Bishop',
    rook: 'Rook',
    queen: 'Queen',
    king: 'King',
};
