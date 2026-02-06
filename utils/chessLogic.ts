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

// Get valid moves for a piece from a given position
export function getValidMoves(piece: PieceType, fromSquare: Square): Square[] {
    const from = squareToPosition(fromSquare);
    const validMoves: Square[] = [];

    switch (piece) {
        case 'pawn':
            // Simplified pawn moves (forward only, assuming white)
            const pawnMoves = [
                { row: from.row + 1, col: from.col }, // Forward 1
            ];
            // Starting position can move 2
            if (from.row === 1) {
                pawnMoves.push({ row: from.row + 2, col: from.col });
            }
            // Diagonal captures (we'll show these as valid move targets)
            pawnMoves.push(
                { row: from.row + 1, col: from.col - 1 },
                { row: from.row + 1, col: from.col + 1 }
            );
            pawnMoves.forEach(pos => {
                if (isValidPosition(pos)) {
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
export function isValidMove(piece: PieceType, fromSquare: Square, toSquare: Square): boolean {
    const validMoves = getValidMoves(piece, fromSquare);
    return validMoves.includes(toSquare);
}
