import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withSequence,
    withTiming,
    withRepeat,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { Position } from '../utils/chessLogic';

interface EnPassantArrowProps {
    from: Position;     // e.g. { row: 6, col: 4 } = e7
    to: Position;       // e.g. { row: 4, col: 4 } = e5
    squareSize: number;
}

/**
 * Animated arrow overlay showing the black pawn's double-move.
 * Renders on top of the board: a dashed trail + animated pawn ghost
 * sliding from `from` to `to`, then a pulsing arrow marker.
 */
export const EnPassantArrow: React.FC<EnPassantArrowProps> = ({ from, to, squareSize }) => {
    const slideProgress = useSharedValue(0);
    const arrowOpacity = useSharedValue(0);
    const arrowPulse = useSharedValue(1);
    const trailOpacity = useSharedValue(0);

    useEffect(() => {
        // Phase 1: Show the trail
        trailOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

        // Phase 2: Animate ghost pawn sliding from → to
        slideProgress.value = withDelay(
            500,
            withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
        );

        // Phase 3: Show arrow indicator and pulse
        arrowOpacity.value = withDelay(1100, withTiming(1, { duration: 300 }));
        arrowPulse.value = withDelay(
            1200,
            withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            )
        );
    }, []);

    // Convert board positions to pixel positions (board is flipped: row 0 = bottom, row 7 = top)
    const fromPixelX = from.col * squareSize + squareSize / 2;
    const fromPixelY = (7 - from.row) * squareSize + squareSize / 2;
    const toPixelX = to.col * squareSize + squareSize / 2;
    const toPixelY = (7 - to.row) * squareSize + squareSize / 2;

    // Ghost pawn animating from start to end
    const ghostStyle = useAnimatedStyle(() => {
        const x = interpolate(slideProgress.value, [0, 1], [fromPixelX, toPixelX]);
        const y = interpolate(slideProgress.value, [0, 1], [fromPixelY, toPixelY]);
        const opacity = interpolate(slideProgress.value, [0, 0.1, 0.9, 1], [0, 0.7, 0.7, 0]);

        return {
            left: x - squareSize * 0.35,
            top: y - squareSize * 0.35,
            opacity,
        };
    });

    // Trail dots
    const trailStyle = useAnimatedStyle(() => ({
        opacity: trailOpacity.value,
    }));

    // Arrow indicator at the destination
    const arrowIndicatorStyle = useAnimatedStyle(() => ({
        opacity: arrowOpacity.value,
        transform: [{ scale: arrowPulse.value }],
    }));

    // Generate trail dots between from and to
    const numDots = 3;
    const dots = [];
    for (let i = 0; i <= numDots; i++) {
        const t = i / numDots;
        const dx = interpolateVal(fromPixelX, toPixelX, t);
        const dy = interpolateVal(fromPixelY, toPixelY, t);
        dots.push({ x: dx, y: dy, key: i });
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Trail dots */}
            <Animated.View style={[StyleSheet.absoluteFill, trailStyle]}>
                {dots.map(dot => (
                    <View
                        key={dot.key}
                        style={[
                            styles.trailDot,
                            {
                                left: dot.x - 4,
                                top: dot.y - 4,
                                width: 8,
                                height: 8,
                            },
                        ]}
                    />
                ))}
                {/* Vertical line connecting dots */}
                <View
                    style={[
                        styles.trailLine,
                        {
                            left: fromPixelX - 1.5,
                            top: Math.min(fromPixelY, toPixelY),
                            height: Math.abs(toPixelY - fromPixelY),
                        },
                    ]}
                />
            </Animated.View>

            {/* Ghost pawn sliding */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        width: squareSize * 0.7,
                        height: squareSize * 0.7,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    ghostStyle,
                ]}
            >
                <Animated.Text style={{ fontSize: squareSize * 0.55, color: 'rgba(0,0,0,0.6)' }}>
                    ♟
                </Animated.Text>
            </Animated.View>

            {/* Arrow head / indicator at destination */}
            <Animated.View
                style={[
                    styles.arrowIndicator,
                    {
                        left: toPixelX - squareSize * 0.3,
                        top: toPixelY - squareSize * 0.55,
                        width: squareSize * 0.6,
                        height: squareSize * 0.35,
                    },
                    arrowIndicatorStyle,
                ]}
            >
                <Animated.Text style={[styles.arrowText, { fontSize: squareSize * 0.3 }]}>
                    ▼
                </Animated.Text>
            </Animated.View>

            {/* "2 steps!" label at the midpoint */}
            <Animated.View
                style={[
                    styles.labelContainer,
                    {
                        left: fromPixelX + squareSize * 0.4,
                        top: (fromPixelY + toPixelY) / 2 - 12,
                    },
                    arrowIndicatorStyle,
                ]}
            >
                <Animated.Text style={styles.labelText}>2 steps!</Animated.Text>
            </Animated.View>
        </View>
    );
};

function interpolateVal(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

const styles = StyleSheet.create({
    trailDot: {
        position: 'absolute',
        borderRadius: 4,
        backgroundColor: 'rgba(255, 69, 58, 0.5)',
    },
    trailLine: {
        position: 'absolute',
        width: 3,
        backgroundColor: 'rgba(255, 69, 58, 0.3)',
        borderRadius: 1.5,
    },
    arrowIndicator: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        color: '#FF453A',
        fontWeight: 'bold',
    },
    labelContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 69, 58, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    labelText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
