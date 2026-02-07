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
export function getValidMoves(
    piece: PieceType,
    fromSquare: Square,
    enemies: Position[] = [],
    friendlies: Position[] = [],
    enPassantTarget?: Square
): Square[] {
    const from = squareToPosition(fromSquare);
    const validMoves: Square[] = [];

    // Helper: is occupied by enemy
    const isEnemy = (r: number, c: number) => enemies.some(pos => pos.row === r && pos.col === c);
    // Helper: is occupied by friendly
    const isFriendly = (r: number, c: number) => friendlies.some(pos => pos.row === r && pos.col === c);
    // Helper: is empty
    const isEmpty = (r: number, c: number) => !isEnemy(r, c) && !isFriendly(r, c);

    // Generic sliding move generator
    const addSlidingMoves = (directions: { r: number, c: number }[]) => {
        directions.forEach(dir => {
            for (let i = 1; i < 8; i++) {
                const target = { row: from.row + dir.r * i, col: from.col + dir.c * i };
                if (!isValidPosition(target)) break;

                if (isFriendly(target.row, target.col)) {
                    break; // Blocked by friendly
                }

                validMoves.push(positionToSquare(target));

                if (isEnemy(target.row, target.col)) {
                    break; // Capture enemy, then stop
                }
            }
        });
    };

    switch (piece) {
        case 'pawn':
            // Forward 1
            if (isEmpty(from.row + 1, from.col)) {
                const f1 = { row: from.row + 1, col: from.col };
                if (isValidPosition(f1)) validMoves.push(positionToSquare(f1));

                // Forward 2
                if (from.row === 1) { // Rank 2
                    const f2 = { row: from.row + 2, col: from.col };
                    if (isEmpty(from.row + 2, from.col) && isValidPosition(f2)) {
                        validMoves.push(positionToSquare(f2));
                    }
                }
            }

            // Captures
            const diagonals = [
                { row: from.row + 1, col: from.col - 1 },
                { row: from.row + 1, col: from.col + 1 }
            ];
            diagonals.forEach(pos => {
                if (isValidPosition(pos)) {
                    const sq = positionToSquare(pos);
                    if (isEnemy(pos.row, pos.col) || sq === enPassantTarget) {
                        validMoves.push(sq);
                    }
                }
            });
            break;

        case 'knight':
            const knightOffsets = [
                { row: 2, col: 1 }, { row: 2, col: -1 },
                { row: -2, col: 1 }, { row: -2, col: -1 },
                { row: 1, col: 2 }, { row: 1, col: -2 },
                { row: -1, col: 2 }, { row: -1, col: -2 },
            ];
            knightOffsets.forEach(offset => {
                const newPos = { row: from.row + offset.row, col: from.col + offset.col };
                if (isValidPosition(newPos) && !isFriendly(newPos.row, newPos.col)) {
                    validMoves.push(positionToSquare(newPos));
                }
            });
            break;

        case 'bishop':
            addSlidingMoves([{ r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 }]);
            break;

        case 'rook':
            addSlidingMoves([{ r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }]);
            break;

        case 'queen':
            addSlidingMoves([
                { r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 },
                { r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 }
            ]);
            break;

        case 'king':
            // Normal moves
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newPos = { row: from.row + dr, col: from.col + dc };
                    if (isValidPosition(newPos) && !isFriendly(newPos.row, newPos.col)) {
                        validMoves.push(positionToSquare(newPos));
                    }
                }
            }

            // CASTLING (Lesson Simplified: Assumes start pos = unmoved)
            // White King Start: e1 (Row 0, Col 4) - Wait, standard is Row 0??
            // My board: Rank 1 is usually Row 0 or Row 7?
            // squareToPosition('e1') -> 'e' is col 4. '1' is row?
            // Let's check `squareToPosition`.
            // Default usually: 'a'->0, '1'->0.
            // But my previous Pawn logic (from.row === 1 -> Rank 2) implies Row 0 is Rank 1.
            // So White King @ e1 is Row 0, Col 4.
            if (from.row === 0 && from.col === 4) {
                // Short Castle (King side) -> Target g1 (Row 0, Col 6)
                // Needs Empty f1 (0,5) and g1 (0,6). Rook at h1 (0,7).
                // And checks? (Ignoring for lesson simplicity).
                if (isEmpty(0, 5) && isEmpty(0, 6) && isFriendly(0, 7)) { // Rook is friendly!
                    // Strictly, check if piece at (0,7) is Rook? The caller (Lessons) ensures setup.
                    validMoves.push(positionToSquare({ row: 0, col: 6 }));
                }

                // Long Castle (Queen side) -> Target c1 (Row 0, Col 2)
                // Needs Empty b1 (0,1), c1 (0,2), d1 (0,3). Rook at a1 (0,0).
                if (isEmpty(0, 1) && isEmpty(0, 2) && isEmpty(0, 3) && isFriendly(0, 0)) {
                    validMoves.push(positionToSquare({ row: 0, col: 2 }));
                }
            }
            break;
    }

    return validMoves;
}

// Check if a move is valid
export function isValidMove(
    piece: PieceType,
    fromSquare: Square,
    toSquare: Square,
    enemies: Position[] = [],
    friendlies: Position[] = [],
    enPassantTarget?: Square
): boolean {
    const validMoves = getValidMoves(piece, fromSquare, enemies, friendlies, enPassantTarget);
    return validMoves.includes(toSquare);
}
