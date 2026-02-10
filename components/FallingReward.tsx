import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Image, ImageSourcePropType } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    Easing,
    interpolate,
    withSequence,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

interface FallingRewardProps {
    image: ImageSourcePropType;
    count?: number;
    duration?: number;
}

interface DropItem {
    id: number;
    startX: number;
    delay: number;
    speed: number;
    scale: number;
    rotateSpeed: number;
    swayAmplitude: number;
}

const DropPiece = React.memo(({ item, image }: { item: DropItem; image: ImageSourcePropType }) => {
    const progress = useSharedValue(0);
    const sway = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            item.delay,
            withTiming(1, { duration: item.speed, easing: Easing.linear })
        );
        sway.value = withDelay(
            item.delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 + Math.random() * 500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(-1, { duration: 1000 + Math.random() * 500, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            )
        );
    }, []);

    const style = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [-100, SH + 100]);
        const translateX = item.swayAmplitude * sway.value;
        const rotate = `${interpolate(progress.value, [0, 1], [0, item.rotateSpeed * 360])}deg`;
        const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);

        return {
            transform: [{ translateX }, { translateY }, { rotate }, { scale: item.scale }],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: item.startX,
                    top: -100, // Start off-screen
                },
                style,
            ]}
        >
            <Image
                source={image}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
            />
        </Animated.View>
    );
});

export const FallingReward: React.FC<FallingRewardProps> = ({ image, count = 25, duration = 3000 }) => {
    const drops = useMemo(() => {
        const items: DropItem[] = [];
        for (let i = 0; i < count; i++) {
            items.push({
                id: i,
                startX: Math.random() * SW,
                delay: Math.random() * (duration * 0.5), // Stagger starts over first half
                speed: 1500 + Math.random() * 1500,      // 1.5s - 3s fall time
                scale: 0.5 + Math.random() * 0.8,        // Random size 0.5x to 1.3x
                rotateSpeed: (Math.random() - 0.5) * 4,  // Random rotation direction/speed
                swayAmplitude: 20 + Math.random() * 40,
            });
        }
        return items;
    }, [count, duration]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {drops.map((item) => (
                <DropPiece key={item.id} item={item} image={image} />
            ))}
        </View>
    );
};
