import { PieceType } from '../types/chess';

export const getPieceScale = (type: PieceType): number => {
    switch (type) {
        case 'pawn': return 0.7;
        case 'knight':
        case 'bishop':
        case 'rook': return 0.8;
        case 'queen':
        case 'king': return 0.85;
        default: return 0.8;
    }
};
