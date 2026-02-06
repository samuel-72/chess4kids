import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS,
    withSpring
} from 'react-native-reanimated';
import { PieceType } from '../stores/progressStore';
import { borderRadius } from '../constants/theme';

// 8x8 board with smaller cells to fit side-by-side
const CELL_SIZE = 25;
const GRID_SIZE = 8;
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

// Piece Emojis
const PIECE_EMOJIS: Record<PieceType | 'pawn_enemy', string> = {
    pawn: '♟',
    pawn_enemy: '♟',
    knight: '♞',
    bishop: '♝',
    rook: '♜',
    queen: '♛',
    king: '♚',
};

type ScenarioType = {
    title: string;
    heroStart: { x: number; y: number };
    heroMove: { dx: number; dy: number };
    enemyStart?: { x: number; y: number };
    enemyMove?: { dx: number; dy: number }; // For En Passant
    transformTo?: PieceType; // For Promotion
};

// PAWN SCENARIOS for Movement Loop (8x8 board, 0-indexed from top)
// Row 6 = rank 2 (pawn starting row for white)
// Row 3 = rank 5 (en passant capture row)
// Row 1 = rank 7 (black pawn starting row)
const PAWN_SCENARIOS: ScenarioType[] = [
    {
        title: "First Move: 2 Steps! 🚀",
        heroStart: { x: 3, y: 6 }, // White pawn on rank 2
        heroMove: { dx: 0, dy: -2 }, // Moves to rank 4
    },
    {
        title: "Regular Move: 1 Step 🚶",
        heroStart: { x: 4, y: 4 }, // Pawn in middle
        heroMove: { dx: 0, dy: -1 },
    },
    {
        title: "Capture Diagonally! ⚔️",
        heroStart: { x: 3, y: 4 },
        heroMove: { dx: 1, dy: -1 },
        enemyStart: { x: 4, y: 3 }, // Target enemy piece
    },
    {
        title: "En Passant! 👻",
        heroStart: { x: 3, y: 3 }, // White Pawn on rank 5
        heroMove: { dx: 1, dy: -1 }, // Captures diagonally
        enemyStart: { x: 4, y: 1 }, // Black pawn starts on rank 7
        enemyMove: { dx: 0, dy: 2 } // Moves 2 squares to rank 5 (row 3)
    }
];

// PROMOTION SCENARIOS (Cycling through options)
// Row 1 = rank 7 (one step from promotion)
const PROMOTION_SCENARIOS: ScenarioType[] = [
    {
        title: "Promote to Queen! ♛",
        heroStart: { x: 4, y: 1 }, // Pawn on rank 7
        heroMove: { dx: 0, dy: -1 }, // Move to rank 8 for promotion
        transformTo: 'queen'
    },
    {
        title: "Promote to Rook! ♜",
        heroStart: { x: 4, y: 1 },
        heroMove: { dx: 0, dy: -1 },
        transformTo: 'rook'
    },
    {
        title: "Promote to Knight! ♞",
        heroStart: { x: 4, y: 1 },
        heroMove: { dx: 0, dy: -1 },
        transformTo: 'knight'
    },
    {
        title: "Promote to Bishop! ♝",
        heroStart: { x: 4, y: 1 },
        heroMove: { dx: 0, dy: -1 },
        transformTo: 'bishop'
    }
];

// Generic Moves for other pieces (8x8 board)
const GENERIC_MOVES: Record<string, ScenarioType[]> = {
    knight: [{ title: "L-Shape Jump", heroStart: { x: 3, y: 4 }, heroMove: { dx: 1, dy: -2 } }],
    bishop: [{ title: "Diagonal Zoom", heroStart: { x: 2, y: 5 }, heroMove: { dx: 3, dy: -3 } }],
    rook: [{ title: "Straight Lines", heroStart: { x: 2, y: 4 }, heroMove: { dx: 4, dy: 0 } }],
    queen: [{ title: "Any Direction", heroStart: { x: 4, y: 6 }, heroMove: { dx: -3, dy: -3 } }],
    king: [{ title: "One Step", heroStart: { x: 4, y: 4 }, heroMove: { dx: 1, dy: 0 } }],
};

const Arrow = ({ start, end, color = 'rgba(255, 170, 0, 0.6)' }: { start: { x: number, y: number }, end: { x: number, y: number }, color?: string }) => {
    const dx = (end.x - start.x) * CELL_SIZE;
    const dy = (end.y - start.y) * CELL_SIZE;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const arrowLength = Math.max(0, distance - 15);

    return (
        <View style={{
            position: 'absolute',
            left: start.x * CELL_SIZE + CELL_SIZE / 2,
            top: start.y * CELL_SIZE + CELL_SIZE / 2,
            width: distance,
            height: 1,
            transform: [{ translateX: -distance / 2 }, { rotate: `${angle}deg` }, { translateX: distance / 2 }],
            alignItems: 'center',
            flexDirection: 'row',
            zIndex: 10,
        }}>
            <View style={{ width: arrowLength, height: 6, backgroundColor: color, borderRadius: 3 }} />
            <View style={{ marginLeft: -8, width: 0, height: 0, borderLeftWidth: 10, borderBottomWidth: 8, borderTopWidth: 8, borderLeftColor: color, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: 'transparent' }} />
        </View>
    );
};

interface MoveTutorialProps {
    piece: PieceType;
    variant?: 'movement' | 'promotion';
    onScenarioChange?: (title: string) => void;
}

export function MoveTutorial({ piece, variant = 'movement', onScenarioChange }: MoveTutorialProps) {
    const [scenarioIndex, setScenarioIndex] = useState(0);

    // Determine Scenarios
    const scenarios = useMemo(() => {
        if (piece === 'pawn') {
            return variant === 'promotion' ? PROMOTION_SCENARIOS : PAWN_SCENARIOS;
        }
        return GENERIC_MOVES[piece] || GENERIC_MOVES['king'];
    }, [piece, variant]);

    const activeScenario = scenarios[scenarioIndex];

    // Animation Values
    const heroX = useSharedValue(0);
    const heroY = useSharedValue(0);
    const enemyX = useSharedValue(0);
    const enemyY = useSharedValue(0);
    const scale = useSharedValue(1);

    const [transformedPiece, setTransformedPiece] = useState<PieceType | null>(null);

    // Call back with title
    useEffect(() => {
        if (onScenarioChange) {
            onScenarioChange(activeScenario.title);
        }
    }, [activeScenario, onScenarioChange]);

    // Cycling Timer
    useEffect(() => {
        // Reset index when scenarios change
        setScenarioIndex(0);
    }, [scenarios]);

    useEffect(() => {
        if (scenarios.length <= 1) return;
        const timer = setInterval(() => {
            setScenarioIndex(prev => (prev + 1) % scenarios.length);
        }, 3000); // 3 seconds per scenario (User requested 2s transition? 3s allows 2s animation + buffer)
        // User said: "transition from one animation to another after 2 seconds"
        // If animation takes ~2s, 2s interval is very tight. Let's try 2500ms.
        return () => clearInterval(timer);
    }, [scenarios.length]);

    // Run Animation for current Scenario
    useEffect(() => {
        // Reset Logic
        heroX.value = 0;
        heroY.value = 0;
        enemyX.value = 0;
        enemyY.value = 0;
        scale.value = 1;
        setTransformedPiece(null);

        const { heroMove, enemyMove, transformTo } = activeScenario;

        // Sequence Configuration
        const MOVE_DELAY = 500;
        const MOVE_DUR = 800;

        // Enemy Move (for En Passant)
        if (enemyMove) {
            // Move enemy into position quickly
            enemyX.value = withDelay(300, withTiming(enemyMove.dx * CELL_SIZE, { duration: 600 }));
            enemyY.value = withDelay(300, withTiming(enemyMove.dy * CELL_SIZE, { duration: 600 }));
        }

        // Hero Move
        heroX.value = withDelay(MOVE_DELAY, withTiming(heroMove.dx * CELL_SIZE, { duration: MOVE_DUR, easing: Easing.inOut(Easing.cubic) }));
        heroY.value = withDelay(MOVE_DELAY, withTiming(heroMove.dy * CELL_SIZE, { duration: MOVE_DUR, easing: Easing.inOut(Easing.cubic) }, (finished) => {
            // Promotion Transform
            if (finished && transformTo) {
                runOnJS(setTransformedPiece)(transformTo);
                scale.value = withSequence(withSpring(1.4), withSpring(1));
            }
        }));

    }, [activeScenario]);

    const animatedHeroStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: heroX.value }, { translateY: heroY.value }, { scale: scale.value }],
    }));

    const animatedEnemyStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: enemyX.value }, { translateY: enemyY.value }],
    }));

    // Grid Rendering
    const squares = useMemo(() => {
        const grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const isLight = (row + col) % 2 === 0;
                grid.push(<View key={`${row}-${col}`} style={[styles.square, isLight ? styles.light : styles.dark]} />);
            }
        }
        return grid;
    }, []);

    const heroStart = activeScenario.heroStart;
    const heroEnd = { x: heroStart.x + activeScenario.heroMove.dx, y: heroStart.y + activeScenario.heroMove.dy };
    const enemyStart = activeScenario.enemyStart;

    return (
        <View style={styles.container}>
            {/* Board */}
            <View style={styles.boardOuter}>
                <View style={styles.board}>
                    {squares}

                    {/* Arrow (Static path) */}
                    <Arrow start={heroStart} end={heroEnd} />
                    {activeScenario.enemyMove && enemyStart && (
                        <Arrow start={enemyStart} end={{ x: enemyStart.x + activeScenario.enemyMove.dx, y: enemyStart.y + activeScenario.enemyMove.dy }} color="rgba(255, 0, 0, 0.4)" />
                    )}

                    {/* Target Highlight */}
                    <View style={[styles.targetMarker, { left: heroEnd.x * CELL_SIZE, top: heroEnd.y * CELL_SIZE }]} />

                    {/* Enemy Piece (Red for visibility) */}
                    {activeScenario.enemyStart && (
                        <Animated.View style={[styles.pieceContainer, { left: activeScenario.enemyStart.x * CELL_SIZE, top: activeScenario.enemyStart.y * CELL_SIZE }, animatedEnemyStyle]}>
                            <Text style={[styles.pieceEmoji, { color: '#ef5350' }]}>♟️</Text>
                        </Animated.View>
                    )}

                    {/* Hero Piece - Use Animated.View wrapper for reliable animation */}
                    <Animated.View style={[styles.pieceContainer, { left: heroStart.x * CELL_SIZE, top: heroStart.y * CELL_SIZE }, animatedHeroStyle]}>
                        <Text style={styles.heroPiece}>
                            {transformedPiece ? PIECE_EMOJIS[transformedPiece] : PIECE_EMOJIS[piece]}
                        </Text>
                    </Animated.View>
                </View>
            </View>
            {/* Small label for the specific board if needed, but main text is below */}
            <Text style={styles.caption}>{activeScenario.title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', margin: 4 }, // Reduced margin
    boardOuter: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#555',
        backgroundColor: '#333',
        elevation: 6,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: BOARD_SIZE,
        height: BOARD_SIZE,
    },
    square: { width: CELL_SIZE, height: CELL_SIZE },
    light: { backgroundColor: '#F0D9B5' }, // More standard chess colors
    dark: { backgroundColor: '#B58863' },
    pieceContainer: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    pieceEmoji: { fontSize: 18 }, // Smaller for 25px cells
    heroPiece: { fontSize: 18, color: '#000' }, // Black pawn, always visible
    targetMarker: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.3)',
        zIndex: 5,
        borderRadius: CELL_SIZE / 2, // Circular marker
    },
    caption: {
        color: '#fff',
        fontSize: 16,
        marginTop: 8,
        fontWeight: 'bold',
    }
});
