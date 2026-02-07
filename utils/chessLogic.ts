import { PieceType } from '../stores/progressStore';

export type Square = string; // e.g., "A1", "D4", "H8"
export type Position = { row: number; col: number }; // 0-indexed, row 0 = rank 1

// Convert algebraic notation to position
export function squareToPosition(square: Square): Position {
    const col = square.charCodeAt(0) - 'A'.charCodeAt(0);
    const row = parseInt(square[1]) - 1;
    return { row, col };
}

// Convert position to algebraic notation
export function positionToSquare(pos: Position): Square {
    const col = String.fromCharCode('A'.charCodeAt(0) + pos.col);
    const row = (pos.row + 1).toString();
    return `${col}${row}`;
}

// Check if position is valid (on the board)
export function isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

// Get valid moves for a piece from a given position, considering occupied squares (enemies)
export function getValidMoves(piece: PieceType, fromSquare: Square, occupiedSquares: Position[] = []): Square[] {
    const from = squareToPosition(fromSquare);
    const validMoves: Square[] = [];

    // Helper to check if a position is occupied by an enemy
    const isOccupied = (r: number, c: number) => occupiedSquares.some(pos => pos.row === r && pos.col === c);

    switch (piece) {
        case 'pawn':
            // Forward 1 (Valid if NOT occupied)
            if (!isOccupied(from.row + 1, from.col)) {
                const f1 = { row: from.row + 1, col: from.col };
                if (isValidPosition(f1)) validMoves.push(positionToSquare(f1));

                // Forward 2 (Valid if Row 1 AND f1 empty AND f2 empty)
                if (from.row === 1) {
                    const f2 = { row: from.row + 2, col: from.col };
                    if (!isOccupied(from.row + 2, from.col) && isValidPosition(f2)) {
                        validMoves.push(positionToSquare(f2));
                    }
                }
            }

            // Diagonal captures (Valid ONLY if occupied by enemy)
            const diagonals = [
                { row: from.row + 1, col: from.col - 1 },
                { row: from.row + 1, col: from.col + 1 }
            ];
            diagonals.forEach(pos => {
                if (isValidPosition(pos) && isOccupied(pos.row, pos.col)) {
                    validMoves.push(positionToSquare(pos));
                }
            });
            break;

        case 'knight':
            // L-shape moves: 2 squares in one direction, 1 square perpendicular
            const knightOffsets = [
                { row: 2, col: 1 }, { row: 2, col: -1 },
                { row: -2, col: 1 }, { row: -2, col: -1 },
                { row: 1, col: 2 }, { row: 1, col: -2 },
                { row: -1, col: 2 }, { row: -1, col: -2 },
            ];
            knightOffsets.forEach(offset => {
                const newPos = { row: from.row + offset.row, col: from.col + offset.col };
                if (isValidPosition(newPos)) {
                    validMoves.push(positionToSquare(newPos));
                }
            });
            break;

        case 'bishop':
            // Diagonal moves
            for (let i = 1; i < 8; i++) {
                const diagonals = [
                    { row: from.row + i, col: from.col + i },
                    { row: from.row + i, col: from.col - i },
                    { row: from.row - i, col: from.col + i },
                    { row: from.row - i, col: from.col - i },
                ];
                diagonals.forEach(pos => {
                    if (isValidPosition(pos)) {
                        validMoves.push(positionToSquare(pos));
                    }
                });
            }
            break;

        case 'rook':
            // Horizontal and vertical moves
            for (let i = 0; i < 8; i++) {
                if (i !== from.row) {
                    validMoves.push(positionToSquare({ row: i, col: from.col }));
                }
                if (i !== from.col) {
                    validMoves.push(positionToSquare({ row: from.row, col: i }));
                }
            }
            break;

        case 'queen':
            // Combination of rook and bishop
            // Diagonals
            for (let i = 1; i < 8; i++) {
                const moves = [
                    { row: from.row + i, col: from.col + i },
                    { row: from.row + i, col: from.col - i },
                    { row: from.row - i, col: from.col + i },
                    { row: from.row - i, col: from.col - i },
                ];
                moves.forEach(pos => {
                    if (isValidPosition(pos)) {
                        validMoves.push(positionToSquare(pos));
                    }
                });
            }
            // Straight lines
            for (let i = 0; i < 8; i++) {
                if (i !== from.row) {
                    validMoves.push(positionToSquare({ row: i, col: from.col }));
                }
                if (i !== from.col) {
                    validMoves.push(positionToSquare({ row: from.row, col: i }));
                }
            }
            break;

        case 'king':
            // One square in any direction
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newPos = { row: from.row + dr, col: from.col + dc };
                    if (isValidPosition(newPos)) {
                        validMoves.push(positionToSquare(newPos));
                    }
                }
            }
            break;
    }

    return validMoves;
}

// Check if a move is valid
export function isValidMove(piece: PieceType, fromSquare: Square, toSquare: Square, occupiedSquares: Position[] = []): boolean {
    const validMoves = getValidMoves(piece, fromSquare, occupiedSquares);
    return validMoves.includes(toSquare);
}
