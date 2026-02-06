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

const CELL_SIZE = 34; // Reduced to fit side-by-side (34*5 = 170 * 2 = 340 + gap)
const GRID_SIZE = 5;
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

// Piece Emojis
const PIECE_EMOJIS: Record<PieceType | 'pawn_enemy', string> = {
    pawn: '♟',
    pawn_enemy: '♟', // Red/Dark pawn?
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

// PAWN SCENARIOS
const PAWN_SCENARIOS: ScenarioType[] = [
    {
        title: "First Move: 2 Steps!",
        heroStart: { x: 2, y: 3 }, // Near bottom
        heroMove: { dx: 0, dy: -2 },
    },
    {
        title: "Regular Move: 1 Step",
        heroStart: { x: 2, y: 2 },
        heroMove: { dx: 0, dy: -1 },
    },
    {
        title: "Capture Diagonally!",
        heroStart: { x: 2, y: 2 },
        heroMove: { dx: 1, dy: -1 },
        enemyStart: { x: 3, y: 1 }, // Target
    },
    {
        title: "En Passant (Special!)",
        heroStart: { x: 1, y: 1 }, // White Pawn at Rank 5 (visual row 1)
        heroMove: { dx: 1, dy: -1 }, // Captures behind
        enemyStart: { x: 2, y: 0 }, // Black starts at Rank 7 (visual row 0)
        enemyMove: { dx: 0, dy: 2 } // Moves 2 squares to Rank 5
    }
];

const PROMOTION_SCENARIO: ScenarioType = {
    title: "Promotion!",
    heroStart: { x: 2, y: 1 }, // Near end
    heroMove: { dx: 0, dy: -1 }, // Moves to end
    transformTo: 'queen'
};

// Generic Moves for other pieces
const GENERIC_MOVES: Record<string, ScenarioType[]> = {
    knight: [{ title: "L-Shape Jump", heroStart: { x: 2, y: 2 }, heroMove: { dx: 1, dy: -2 } }],
    bishop: [{ title: "Diagonal Zoom", heroStart: { x: 1, y: 3 }, heroMove: { dx: 2, dy: -2 } }],
    rook: [{ title: "Straight Lines", heroStart: { x: 1, y: 2 }, heroMove: { dx: 2, dy: 0 } }],
    queen: [{ title: "Any Direction", heroStart: { x: 2, y: 3 }, heroMove: { dx: -2, dy: -2 } }],
    king: [{ title: "One Step", heroStart: { x: 2, y: 2 }, heroMove: { dx: 1, dy: 0 } }],
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
}

export function MoveTutorial({ piece, variant = 'movement' }: MoveTutorialProps) {
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
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1); // For promotion pop

    const [transformedPiece, setTransformedPiece] = useState<PieceType | null>(null);

    // Cycle through scenarios
    useEffect(() => {
        // Reset state when scenario list changes
        setScenarioIndex(0);
    }, [scenarios]);

    useEffect(() => {
        if (scenarios.length <= 1) return;
        const timer = setInterval(() => {
            setScenarioIndex(prev => (prev + 1) % scenarios.length);
        }, 3000); // 3 seconds per scenario for better readability
        return () => clearInterval(timer);
    }, [scenarios.length]);

    // Run Animation for current Scenario
    useEffect(() => {
        // Reset
        heroX.value = 0;
        heroY.value = 0;
        enemyX.value = 0;
        enemyY.value = 0;
        opacity.value = 0;
        scale.value = 1;
        setTransformedPiece(null);

        const { heroMove, enemyMove, transformTo } = activeScenario;

        // Sequence
        // 1. Fade In
        opacity.value = withTiming(1, { duration: 500 });

        // 2. Enemy Move (if En Passant)
        if (enemyMove) {
            enemyX.value = withDelay(500, withTiming(enemyMove.dx * CELL_SIZE, { duration: 800 }));
            enemyY.value = withDelay(500, withTiming(enemyMove.dy * CELL_SIZE, { duration: 800 }));
        }

        // 3. Hero Move
        const moveDelay = enemyMove ? 1500 : 800;
        heroX.value = withDelay(moveDelay, withTiming(heroMove.dx * CELL_SIZE, { duration: 1000, easing: Easing.inOut(Easing.cubic) }));
        heroY.value = withDelay(moveDelay, withTiming(heroMove.dy * CELL_SIZE, { duration: 1000, easing: Easing.inOut(Easing.cubic) }, () => {
            // 4. Promotion Transform
            if (transformTo) {
                runOnJS(setTransformedPiece)(transformTo);
                scale.value = withSequence(withSpring(1.5), withSpring(1));
            }
        }));

        // 5. Fade Out (if loop)
        if (scenarios.length > 1) {
            opacity.value = withDelay(3500, withTiming(0, { duration: 500 }));
        }

    }, [activeScenario]); // Re-run when scenario changes

    const animatedHeroStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: heroX.value }, { translateY: heroY.value }, { scale: scale.value }],
        opacity: opacity.value
    }));

    const animatedEnemyStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: enemyX.value }, { translateY: enemyY.value }],
        opacity: opacity.value
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
            <View style={styles.header}>
                <Text style={styles.scenarioTitle}>{activeScenario.title}</Text>
            </View>
            <View style={styles.board}>
                {squares}

                {/* Arrow */}
                <Arrow start={heroStart} end={heroEnd} />
                {activeScenario.enemyMove && enemyStart && (
                    <Arrow start={enemyStart} end={{ x: enemyStart.x + activeScenario.enemyMove.dx, y: enemyStart.y + activeScenario.enemyMove.dy }} color="rgba(255, 0, 0, 0.4)" />
                )}

                {/* Target Marker */}
                <View style={[styles.targetMarker, { left: heroEnd.x * CELL_SIZE, top: heroEnd.y * CELL_SIZE }]} />

                {/* Enemy Piece */}
                {activeScenario.enemyStart && (
                    <Animated.View style={[styles.pieceContainer, { left: activeScenario.enemyStart.x * CELL_SIZE, top: activeScenario.enemyStart.y * CELL_SIZE }, animatedEnemyStyle]}>
                        <Text style={[styles.pieceEmoji, { color: 'red' }]}>♟️</Text>
                        <View style={styles.enemyDot} />
                    </Animated.View>
                )}

                {/* Hero Piece */}
                <View style={[styles.pieceContainer, { left: heroStart.x * CELL_SIZE, top: heroStart.y * CELL_SIZE }]}>
                    <Animated.Text style={[styles.pieceEmoji, animatedHeroStyle]}>
                        {transformedPiece ? PIECE_EMOJIS[transformedPiece] : PIECE_EMOJIS[piece]}
                    </Animated.Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', gap: 10 },
    header: { height: 30, justifyContent: 'center' },
    scenarioTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    boardOuter: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4a4a4a',
        backgroundColor: '#333',
        elevation: 10,
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4a4a4a',
    },
    square: { width: CELL_SIZE, height: CELL_SIZE },
    light: { backgroundColor: '#EEEED2' },
    dark: { backgroundColor: '#769656' },
    pieceContainer: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    pieceEmoji: { fontSize: 32 },
    targetMarker: {
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        zIndex: 5,
    },
    enemyDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red'
    }
});
