import { getValidMoves, isValidMove, squareToPosition, positionToSquare } from '../chessLogic';

describe('chessLogic', () => {
    // ─── Coordinate Conversions ───
    describe('squareToPosition & positionToSquare', () => {
        it('converts A1 ↔ {row:0, col:0}', () => {
            expect(squareToPosition('A1')).toEqual({ row: 0, col: 0 });
            expect(positionToSquare({ row: 0, col: 0 })).toBe('A1');
        });

        it('converts H8 ↔ {row:7, col:7}', () => {
            expect(squareToPosition('H8')).toEqual({ row: 7, col: 7 });
            expect(positionToSquare({ row: 7, col: 7 })).toBe('H8');
        });

        it('converts E4 ↔ {row:3, col:4}', () => {
            expect(squareToPosition('E4')).toEqual({ row: 3, col: 4 });
            expect(positionToSquare({ row: 3, col: 4 })).toBe('E4');
        });
    });

    // ─── Pawn ───
    describe('Pawn moves', () => {
        it('moves forward 1 square', () => {
            const moves = getValidMoves('pawn', 'D3');
            expect(moves).toContain('D4');
        });

        it('moves forward 2 from starting rank (rank 2)', () => {
            const moves = getValidMoves('pawn', 'A2');
            expect(moves).toContain('A3');
            expect(moves).toContain('A4');
        });

        it('does NOT move forward 2 from non-starting rank', () => {
            const moves = getValidMoves('pawn', 'A3');
            expect(moves).toContain('A4');
            expect(moves).not.toContain('A5');
        });

        it('cannot move forward when blocked', () => {
            // Friendly piece at D4 blocks Pawn at D3
            const moves = getValidMoves('pawn', 'D3', [], [{ row: 3, col: 3 }]);
            expect(moves).not.toContain('D4');
        });

        it('captures diagonally when enemy present', () => {
            // Pawn at D3, enemies at C4 and E4
            const moves = getValidMoves('pawn', 'D3', [
                { row: 3, col: 2 }, // C4
                { row: 3, col: 4 }, // E4
            ]);
            expect(moves).toContain('C4');
            expect(moves).toContain('E4');
        });

        it('does NOT capture diagonally when empty', () => {
            const moves = getValidMoves('pawn', 'D3');
            expect(moves).not.toContain('C4');
            expect(moves).not.toContain('E4');
        });

        it('supports en passant', () => {
            // Pawn at D5, en passant target at E6
            const moves = getValidMoves('pawn', 'D5', [], [], 'E6');
            expect(moves).toContain('E6');
        });
    });

    // ─── Knight ───
    describe('Knight moves', () => {
        it('moves in L-shape from center', () => {
            // Knight at D4 → 8 possible squares
            const moves = getValidMoves('knight', 'D4');
            expect(moves).toContain('C6'); // -1, +2
            expect(moves).toContain('E6'); // +1, +2
            expect(moves).toContain('B5'); // -2, +1
            expect(moves).toContain('F5'); // +2, +1
            expect(moves).toContain('B3'); // -2, -1
            expect(moves).toContain('F3'); // +2, -1
            expect(moves).toContain('C2'); // -1, -2
            expect(moves).toContain('E2'); // +1, -2
            expect(moves).toHaveLength(8);
        });

        it('is limited at board edge', () => {
            // Knight at A1 → only 2 possible squares
            const moves = getValidMoves('knight', 'A1');
            expect(moves).toContain('B3');
            expect(moves).toContain('C2');
            expect(moves).toHaveLength(2);
        });

        it('cannot land on friendly', () => {
            // Knight at A1, friendly at B3
            const moves = getValidMoves('knight', 'A1', [], [{ row: 2, col: 1 }]);
            expect(moves).not.toContain('B3');
            expect(moves).toContain('C2');
        });

        it('can capture enemy', () => {
            // Knight at A1, enemy at B3
            const moves = getValidMoves('knight', 'A1', [{ row: 2, col: 1 }]);
            expect(moves).toContain('B3');
        });
    });

    // ─── Bishop ───
    describe('Bishop moves (sliding diagonal)', () => {
        it('slides in all 4 diagonals from center', () => {
            const moves = getValidMoves('bishop', 'D4');
            // NE diagonal
            expect(moves).toContain('E5');
            expect(moves).toContain('F6');
            expect(moves).toContain('G7');
            expect(moves).toContain('H8');
            // NW diagonal
            expect(moves).toContain('C5');
            expect(moves).toContain('B6');
            expect(moves).toContain('A7');
            // SE diagonal
            expect(moves).toContain('E3');
            expect(moves).toContain('F2');
            expect(moves).toContain('G1');
            // SW diagonal
            expect(moves).toContain('C3');
            expect(moves).toContain('B2');
            expect(moves).toContain('A1');
        });

        it('is blocked by friendly', () => {
            // Bishop at D4, friendly at F6
            const moves = getValidMoves('bishop', 'D4', [], [{ row: 5, col: 5 }]);
            expect(moves).toContain('E5');
            expect(moves).not.toContain('F6');
            expect(moves).not.toContain('G7');
        });

        it('captures enemy then stops', () => {
            // Bishop at D4, enemy at F6
            const moves = getValidMoves('bishop', 'D4', [{ row: 5, col: 5 }]);
            expect(moves).toContain('E5');
            expect(moves).toContain('F6'); // Capture
            expect(moves).not.toContain('G7'); // Blocked after capture
        });
    });

    // ─── Rook ───
    describe('Rook moves (sliding straight)', () => {
        it('slides vertically and horizontally', () => {
            const moves = getValidMoves('rook', 'A1');
            // Horizontal
            expect(moves).toContain('B1');
            expect(moves).toContain('H1');
            // Vertical
            expect(moves).toContain('A2');
            expect(moves).toContain('A8');
            expect(moves).toHaveLength(14); // 7 horizontal + 7 vertical
        });

        it('is blocked by friendly', () => {
            // Rook at A1, friendly at A3
            const moves = getValidMoves('rook', 'A1', [], [{ row: 2, col: 0 }]);
            expect(moves).toContain('A2');
            expect(moves).not.toContain('A3');
            expect(moves).not.toContain('A4');
        });

        it('captures enemy but stops', () => {
            // Rook at A1, enemy at A3
            const moves = getValidMoves('rook', 'A1', [{ row: 2, col: 0 }]);
            expect(moves).toContain('A2');
            expect(moves).toContain('A3'); // Capture
            expect(moves).not.toContain('A4'); // Stop
        });
    });

    // ─── Queen ───
    describe('Queen moves (slides all directions)', () => {
        it('combines rook + bishop moves', () => {
            const moves = getValidMoves('queen', 'D4');
            // Straight (rook-like)
            expect(moves).toContain('D8');
            expect(moves).toContain('D1');
            expect(moves).toContain('A4');
            expect(moves).toContain('H4');
            // Diagonal (bishop-like)
            expect(moves).toContain('A1');
            expect(moves).toContain('H8');
            expect(moves).toContain('A7');
            expect(moves).toContain('G1');
        });
    });

    // ─── King ───
    describe('King moves', () => {
        it('moves 1 square in any direction', () => {
            const moves = getValidMoves('king', 'E4');
            expect(moves).toContain('E5');
            expect(moves).toContain('D5');
            expect(moves).toContain('D4');
            expect(moves).toContain('D3');
            expect(moves).toContain('E3');
            expect(moves).toContain('F3');
            expect(moves).toContain('F4');
            expect(moves).toContain('F5');
            expect(moves).toHaveLength(8);
        });

        it('is limited at corner', () => {
            const moves = getValidMoves('king', 'A1');
            expect(moves).toContain('A2');
            expect(moves).toContain('B1');
            expect(moves).toContain('B2');
            expect(moves).toHaveLength(3);
        });

        it('cannot move onto friendly', () => {
            // King at E4, friendly at E5
            const moves = getValidMoves('king', 'E4', [], [{ row: 4, col: 4 }]);
            expect(moves).not.toContain('E5');
        });

        it('allows short castling (king side)', () => {
            // King at E1 (0,4), Rook at H1 (0,7) is friendly, F1 and G1 empty
            const moves = getValidMoves('king', 'E1', [], [{ row: 0, col: 7 }]);
            expect(moves).toContain('G1');
        });

        it('allows long castling (queen side)', () => {
            // King at E1 (0,4), Rook at A1 (0,0) is friendly, B1/C1/D1 empty
            const moves = getValidMoves('king', 'E1', [], [{ row: 0, col: 0 }]);
            expect(moves).toContain('C1');
        });

        it('denies castling if path blocked', () => {
            // King at E1, Rook at H1, but F1 has a friendly
            const moves = getValidMoves('king', 'E1', [], [
                { row: 0, col: 7 }, // H1 rook
                { row: 0, col: 5 }, // F1 blocker
            ]);
            expect(moves).not.toContain('G1');
        });
    });

    // ─── isValidMove ───
    describe('isValidMove', () => {
        it('returns true for a valid pawn move', () => {
            expect(isValidMove('pawn', 'A2', 'A3')).toBe(true);
        });

        it('returns false for an invalid pawn move', () => {
            expect(isValidMove('pawn', 'A2', 'B3')).toBe(false);
        });

        it('returns true for a valid knight move', () => {
            expect(isValidMove('knight', 'B1', 'C3')).toBe(true);
        });

        it('returns false for an invalid knight move', () => {
            expect(isValidMove('knight', 'B1', 'B2')).toBe(false);
        });
    });
});
