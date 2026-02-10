import { getPieceScale } from '../pieceScaling';

describe('getPieceScale', () => {
    it('returns 0.7 for pawn', () => {
        expect(getPieceScale('pawn')).toBe(0.7);
    });

    it('returns 0.8 for knight, bishop, rook', () => {
        expect(getPieceScale('knight')).toBe(0.8);
        expect(getPieceScale('bishop')).toBe(0.8);
        expect(getPieceScale('rook')).toBe(0.8);
    });

    it('returns 0.85 for queen and king', () => {
        expect(getPieceScale('queen')).toBe(0.85);
        expect(getPieceScale('king')).toBe(0.85);
    });
});
