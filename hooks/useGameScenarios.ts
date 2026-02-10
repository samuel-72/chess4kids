import { useCallback } from 'react';
import { PieceType } from '../types/chess';
import { Position, getValidMoves, positionToSquare } from '../utils/chessLogic';

export type Scenario = {
    piecePos: Position;
    enemies: Position[];
    friendlies: { row: number; col: number; type: PieceType }[];
    enPassantTarget?: string;
    hint?: string;
};

export function useGameScenarios(piece: PieceType) {
    const generateScenario = useCallback((currentRound: number = 1): Scenario => {
        let piecePos: Position = { row: 0, col: 0 };
        const enemies: Position[] = [];
        const friendlies: { row: number; col: number; type: PieceType }[] = [];
        let enPassantTarget: string | undefined;
        let hint: string | undefined;

        switch (piece) {
            case 'pawn':
                if (currentRound === 1) {
                    piecePos = { row: 3, col: 3 }; // Middle
                    // Normal move
                } else if (currentRound === 2) {
                    // Blocked 2-step!
                    piecePos = { row: 1, col: 4 }; // Start pos
                    // Friendly at 2 steps away (row 3)
                    friendlies.push({ row: 3, col: 4, type: 'rook' });
                    hint = "Blocked! You can't jump over friends. Move 1 step.";
                } else if (currentRound === 3 || currentRound === 4) {
                    piecePos = { row: 3, col: 3 + Math.floor(Math.random() * 2) };
                    const side = Math.random() > 0.5 ? 1 : -1;
                    enemies.push({ row: piecePos.row + 1, col: piecePos.col + side });
                    hint = "Capturing is fun! ⚔️";
                } else if (currentRound === 5) {
                    piecePos = { row: 4, col: 3 };
                    enemies.push({ row: 4, col: 4 });
                    const targetPos = { row: 5, col: 4 };
                    enPassantTarget = positionToSquare(targetPos);
                    hint = "En Passant! The enemy pawn just jumped 2 steps! 👻";
                } else {
                    piecePos = { row: 1 + Math.floor(Math.random() * 5), col: Math.floor(Math.random() * 8) };
                    if (currentRound > 1 && Math.random() > 0.6) {
                        const side = Math.random() > 0.5 ? 1 : -1;
                        const enemyPos = { row: piecePos.row + 1, col: piecePos.col + side };
                        if (enemyPos.col >= 0 && enemyPos.col < 8 && enemyPos.row < 8) enemies.push(enemyPos);
                    }
                }
                break;

            case 'knight':
                // Start center-ish
                piecePos = { row: 3 + Math.floor(Math.random() * 2), col: 3 + Math.floor(Math.random() * 2) };

                if (currentRound === 3) {
                    // Practice JUMPING over friendlies (Vertical)
                    friendlies.push({ row: piecePos.row + 1, col: piecePos.col, type: 'pawn' });
                    hint = "Knights can jump over friends! 🐎";
                } else if (currentRound === 4) {
                    // Practice JUMPING over friendlies (Horizontal/Complex)
                    friendlies.push({ row: piecePos.row, col: piecePos.col + 1, type: 'pawn' });
                    friendlies.push({ row: piecePos.row - 1, col: piecePos.col, type: 'pawn' });
                    hint = "Jump over the wall! 🧱";
                } else if (currentRound === 5) {
                    // Blocked Landing!
                    // Place friendlies on 2 valid spots
                    const moves = getValidMoves('knight', positionToSquare(piecePos), [], []);
                    if (moves.length > 0) {
                        const offsets = [{ r: 2, c: 1 }, { r: -2, c: -1 }];
                        offsets.forEach(off => {
                            const p = { row: piecePos.row + off.r, col: piecePos.col + off.c };
                            if (p.row >= 0 && p.row < 8 && p.col >= 0 && p.col < 8) {
                                friendlies.push({ ...p, type: 'pawn' });
                            }
                        });
                        hint = "Watch out! Don't land on your friends! 🚫";
                    }
                } else if (currentRound >= 6) {
                    // Capture
                    hint = "Capture the enemy!";
                    const offsets = [{ r: 2, c: 1 }, { r: 2, c: -1 }, { r: -2, c: 1 }];
                    const off = offsets[Math.floor(Math.random() * offsets.length)];
                    const enemyPos = { row: piecePos.row + off.r, col: piecePos.col + off.c };
                    if (enemyPos.row >= 0 && enemyPos.row < 8 && enemyPos.col >= 0 && enemyPos.col < 8) {
                        enemies.push(enemyPos);
                    }
                }
                break;

            case 'king':
                if (currentRound === 2) {
                    // Blocked Scenarios
                    piecePos = { row: 3, col: 3 };
                    // Surround partially
                    friendlies.push({ row: 3, col: 4, type: 'pawn' });
                    friendlies.push({ row: 4, col: 3, type: 'pawn' });
                    hint = "Don't step on your friends! 👑";
                } else if (currentRound === 3) {
                    // Short Castle
                    piecePos = { row: 0, col: 4 }; // e1
                    friendlies.push({ row: 0, col: 7, type: 'rook' }); // h1 Rook
                    hint = "Short Castle! Move King 2 steps right. 🏰";
                } else if (currentRound === 4) {
                    // Long Castle
                    piecePos = { row: 0, col: 4 }; // e1
                    friendlies.push({ row: 0, col: 0, type: 'rook' }); // a1 Rook
                    hint = "Long Castle! Move King 2 steps left. 🏰";
                } else if (currentRound >= 5) {
                    // Capture - Randomized
                    let attempts = 0;
                    while (attempts < 20) {
                        const r = Math.floor(Math.random() * 6) + 1;
                        const c = Math.floor(Math.random() * 6) + 1;
                        const offsets = [{ r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 }];
                        const dir = offsets[Math.floor(Math.random() * offsets.length)];
                        const eR = r + dir.r;
                        const eC = c + dir.c;
                        if (eR >= 0 && eR < 8 && eC >= 0 && eC < 8) {
                            piecePos = { row: r, col: c };
                            enemies.push({ row: eR, col: eC });
                            break;
                        }
                        attempts++;
                    }
                    if (enemies.length === 0) {
                        piecePos = { row: 3, col: 3 };
                        enemies.push({ row: 4, col: 4 });
                    }
                    hint = "Kings can capture too! 👑";
                } else {
                    piecePos = { row: 3, col: 3 };
                }
                break;

            case 'rook':
            case 'bishop':
            case 'queen':
                piecePos = { row: 3, col: 3 };

                if (currentRound === 2) {
                    // Blocked Path
                    const dirs = piece === 'bishop' ? [{ r: 1, c: 1 }] : piece === 'rook' ? [{ r: 0, c: 1 }] : [{ r: 1, c: 1 }];
                    const dir = dirs[0];
                    friendlies.push({ row: piecePos.row + dir.r * 2, col: piecePos.col + dir.c * 2, type: 'pawn' });
                    hint = "You can't move through friends! Stop before them. 🛑";
                } else if (currentRound >= 3) {
                    // Randomized Capture Scenario
                    let attempts = 0;
                    while (attempts < 20) {
                        const r = Math.floor(Math.random() * 6) + 1;
                        const c = Math.floor(Math.random() * 6) + 1;

                        let validDirs: { r: number, c: number }[] = [];
                        if (piece === 'bishop' || piece === 'queen') validDirs.push({ r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 });
                        if (piece === 'rook' || piece === 'queen') validDirs.push({ r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 });

                        const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                        const dist = 1 + Math.floor(Math.random() * 3);

                        const eR = r + dir.r * dist;
                        const eC = c + dir.c * dist;

                        if (eR >= 0 && eR < 8 && eC >= 0 && eC < 8) {
                            piecePos = { row: r, col: c };
                            enemies.push({ row: eR, col: eC });
                            break;
                        }
                        attempts++;
                    }
                    if (enemies.length === 0) {
                        piecePos = { row: 3, col: 3 };
                        const fallbackDir = piece === 'bishop' ? { r: 1, c: 1 } : { r: 0, c: 1 };
                        enemies.push({ row: piecePos.row + fallbackDir.r * 2, col: piecePos.col + fallbackDir.c * 2 });
                    }
                    hint = "Slide and Capture! 🚀";
                }
                break;
        }

        return { piecePos, enemies, friendlies, enPassantTarget, hint };
    }, [piece]);

    return { generateScenario };
}
