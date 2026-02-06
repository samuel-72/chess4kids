import { Audio } from 'expo-av';

// Sound effects for the game
// Using web-safe approach with synthetic sounds

let isSoundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
    isSoundEnabled = enabled;
};

// Create simple beep sounds using Audio API
// For web compatibility, we use Audio with base64 encoded sounds

// Simple celebration jingle (short beeps)
const playCelebrationJingle = async () => {
    if (!isSoundEnabled) return;

    try {
        // Create a simple audio context for web
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Play a happy ascending melody
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            for (let i = 0; i < notes.length; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = notes[i];
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.2);
                }, i * 100);
            }
        }
    } catch (e) {
        console.log('Sound not available:', e);
    }
};

// Simple move sound
const playMoveSound = async () => {
    if (!isSoundEnabled) return;

    try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 440; // A4
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    } catch (e) {
        console.log('Sound not available:', e);
    }
};

// Error sound (wrong move)
const playErrorSound = async () => {
    if (!isSoundEnabled) return;

    try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 200; // Low buzzer
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
        }
    } catch (e) {
        console.log('Sound not available:', e);
    }
};

export const SoundEffects = {
    celebrate: playCelebrationJingle,
    move: playMoveSound,
    error: playErrorSound,
};
