import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { FallingReward } from './FallingReward';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Ring Shockwave Component ───
const RingShockwave = () => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withTiming(3, { duration: 800, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) });
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: SW / 2 - 60,
                    top: SH / 2 - 60,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: '#FFD700',
                },
                style,
            ]}
        />
    );
};

// ─── Second Ring (delayed) ───
const RingShockwave2 = () => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withDelay(150, withTiming(2.5, { duration: 700, easing: Easing.out(Easing.quad) }));
        opacity.value = withDelay(150, withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: SW / 2 - 40,
                    top: SH / 2 - 40,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 215, 0, 0.6)',
                },
                style,
            ]}
        />
    );
};

// ─── Main Celebration Overlay ───
interface CelebrationProps {
    visible: boolean;
    rewardImage?: any; // ImageSourcePropType or any
    onComplete?: () => void;
}

export default function CelebrationOverlay({
    visible,
    rewardImage,
    onComplete,
}: CelebrationProps) {
    const overlayOpacity = useSharedValue(0);

    // (Confetti/Star code removed)

    useEffect(() => {
        if (visible) {
            overlayOpacity.value = withTiming(1, { duration: 200 });
        } else {
            overlayOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
                if (finished && onComplete) {
                    runOnJS(onComplete)();
                }
            });
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
        pointerEvents: overlayOpacity.value > 0.1 ? 'auto' as const : 'none' as const,
    }));

    if (!visible) return null;

    // Extract image if available (it should be, based on new types)
    // The message prop is now simpler, we just want the reward image.
    // However, the component signature didn't change, so we rely on the parent passing the right data or updated props.
    // Ideally we should update the props to accept 'reward' object.
    // For now, let's assume the parent passes the reward object OR we need to update the props.
    // Actually, let's update the props to be cleaner.

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            {/* Ring shockwaves for impact */}
            <RingShockwave />
            <RingShockwave2 />

            {/* Falling Reward Rain */}
            {rewardImage && (
                <FallingReward image={rewardImage} />
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        // Lighter background so the rewards pop
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
});
