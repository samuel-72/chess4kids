import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fun celebration emojis - colorful and kid-friendly!
const CELEBRATION_EMOJIS = [
    // Sweet treats 🍬
    '🍫', '🍬', '🍭', '🧁', '🍪', '🎂', '🍰', '🍩',
    // Magical creatures 🦄
    '🦄', '🐴', '🦋', '🌈', '✨', '💫', '⭐', '🌟',
    // Cute animals 🐱
    '🐶', '🐕', '🐱', '🐈', '🐰', '🐻', '🐼', '🦊',
    // Dinosaurs 🦕
    '🦕', '🦖', '🐲', '🐉',
    // Celebration 🎉
    '🎉', '🎊', '🎈', '🎁', '🏆', '👑', '💎', '❤️',
];

interface CelebrationProps {
    visible: boolean;
    message?: string;
    onComplete?: () => void;
}

interface Particle {
    key: string;
    emoji: string;
    startX: number;
    startY: number;
    translateX: Animated.Value;
    translateY: Animated.Value;
    rotate: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
}

export default function CelebrationOverlay({ visible, message = 'Amazing!', onComplete }: CelebrationProps) {
    const particles = useRef<Particle[]>([]);
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const messageScale = useRef(new Animated.Value(0)).current;
    const [renderParticles, setRenderParticles] = React.useState<Particle[]>([]);

    useEffect(() => {
        if (visible) {
            // Create explosion of particles
            const newParticles: Particle[] = [];
            const numParticles = 30;

            for (let i = 0; i < numParticles; i++) {
                const angle = (Math.PI * 2 * i) / numParticles;
                const velocity = 150 + Math.random() * 200;

                newParticles.push({
                    key: `particle-${Date.now()}-${i}`,
                    emoji: CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)],
                    startX: SCREEN_WIDTH / 2,
                    startY: SCREEN_HEIGHT / 2,
                    translateX: new Animated.Value(0),
                    translateY: new Animated.Value(0),
                    rotate: new Animated.Value(0),
                    scale: new Animated.Value(0),
                    opacity: new Animated.Value(1),
                });
            }

            particles.current = newParticles;
            setRenderParticles(newParticles);

            // Animate overlay in
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Animate message
            Animated.spring(messageScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }).start();

            // Animate particles
            newParticles.forEach((particle, index) => {
                const angle = (Math.PI * 2 * index) / numParticles + Math.random() * 0.5;
                const velocity = 150 + Math.random() * 200;
                const targetX = Math.cos(angle) * velocity;
                const targetY = Math.sin(angle) * velocity - 100; // Bias upward

                Animated.sequence([
                    Animated.delay(index * 30),
                    Animated.parallel([
                        // Scale in
                        Animated.spring(particle.scale, {
                            toValue: 1 + Math.random() * 0.5,
                            friction: 4,
                            useNativeDriver: true,
                        }),
                        // Move outward
                        Animated.timing(particle.translateX, {
                            toValue: targetX,
                            duration: 1200,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(particle.translateY, {
                            toValue: targetY + 200, // Fall with gravity
                            duration: 1200,
                            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                            useNativeDriver: true,
                        }),
                        // Rotate
                        Animated.timing(particle.rotate, {
                            toValue: Math.random() * 4 - 2, // Random rotation
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                        // Fade out
                        Animated.timing(particle.opacity, {
                            toValue: 0,
                            duration: 1200,
                            delay: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            });

            // Fade out and complete
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(overlayOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(messageScale, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setRenderParticles([]);
                    onComplete?.();
                });
            }, 1500);
        }
    }, [visible]);

    if (!visible && renderParticles.length === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none">
            {/* Particles */}
            {renderParticles.map((particle) => (
                <Animated.Text
                    key={particle.key}
                    style={[
                        styles.particle,
                        {
                            left: particle.startX,
                            top: particle.startY,
                            transform: [
                                { translateX: particle.translateX },
                                { translateY: particle.translateY },
                                { scale: particle.scale },
                                {
                                    rotate: particle.rotate.interpolate({
                                        inputRange: [-2, 2],
                                        outputRange: ['-720deg', '720deg'],
                                    }),
                                },
                            ],
                            opacity: particle.opacity,
                        },
                    ]}
                >
                    {particle.emoji}
                </Animated.Text>
            ))}

            {/* Center message */}
            <Animated.View
                style={[
                    styles.messageContainer,
                    {
                        transform: [{ scale: messageScale }],
                    },
                ]}
            >
                <Text style={styles.messageEmojis}>🎉 ⭐ 🎉</Text>
                <Text style={styles.message}>{message}</Text>
                <Text style={styles.messageEmojis}>🦄 💎 🦄</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    particle: {
        position: 'absolute',
        fontSize: 40,
        marginLeft: -20,
        marginTop: -20,
    },
    messageContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 40,
        paddingVertical: 24,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    messageEmojis: {
        fontSize: 28,
        letterSpacing: 8,
    },
    message: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6B4EE6',
        marginVertical: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
