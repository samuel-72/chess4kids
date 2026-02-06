import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from './stores/authStore';
import { colors, spacing, fontSize, borderRadius } from './constants/theme';
import PracticeScreen from './screens/PracticeScreen';

type Screen = 'loading' | 'login' | 'home' | 'lesson' | 'practice';
type PieceName = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

const PIECES: { name: PieceName; emoji: string; label: string; color: string }[] = [
  { name: 'pawn', emoji: '♟', label: 'Pawn', color: '#4CAF50' },
  { name: 'knight', emoji: '♞', label: 'Knight', color: '#FF9800' },
  { name: 'bishop', emoji: '♝', label: 'Bishop', color: '#9C27B0' },
  { name: 'rook', emoji: '♜', label: 'Rook', color: '#2196F3' },
  { name: 'queen', emoji: '♛', label: 'Queen', color: '#E91E63' },
  { name: 'king', emoji: '♚', label: 'King', color: '#FFD700' },
];

const PIECE_LESSONS: Record<PieceName, { title: string; description: string; movement: string }> = {
  pawn: {
    title: '♟ The Pawn',
    description: 'Pawns are the smallest pieces but there are lots of them! They move forward one square at a time.',
    movement: 'Move forward 1 square (or 2 on first move). Captures diagonally!',
  },
  knight: {
    title: '♞ The Knight',
    description: 'Knights are special! They can jump over other pieces and move in an L-shape.',
    movement: 'Moves in an L-shape: 2 squares one way, then 1 square to the side.',
  },
  bishop: {
    title: '♝ The Bishop',
    description: 'Bishops move diagonally across the board. They stay on the same color!',
    movement: 'Moves diagonally any number of squares.',
  },
  rook: {
    title: '♜ The Rook',
    description: 'Rooks are powerful pieces that move in straight lines!',
    movement: 'Moves horizontally or vertically any number of squares.',
  },
  queen: {
    title: '♛ The Queen',
    description: 'The Queen is the most powerful piece! She can move in any direction.',
    movement: 'Moves horizontally, vertically, or diagonally any number of squares.',
  },
  king: {
    title: '♚ The King',
    description: 'The King is the most important piece! Protect your King at all costs.',
    movement: 'Moves one square in any direction.',
  },
};

function LoginScreen({ onNavigate }: { onNavigate: () => void }) {
  const { loginAsGuest } = useAuthStore();

  const handleLogin = () => {
    console.log('🔑 Logging in as guest...');
    loginAsGuest();
    onNavigate();
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark, '#2D1B69']}
      style={styles.loginContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.logoEmoji}>♚</Text>
        <Text style={styles.title}>Chess Kids</Text>
        <Text style={styles.subtitle}>Learn Chess the Fun Way! 🎉</Text>

        <Pressable onPress={handleLogin} style={styles.button}>
          <Text style={styles.buttonText}>🎮 Play as Guest</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

function HomeScreen({
  onLogout,
  onSelectPiece,
}: {
  onLogout: () => void;
  onSelectPiece: (piece: PieceName) => void;
}) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.homeContainer}>
      <Text style={styles.greeting}>Hello, {user?.name || 'Champion'}! 👋</Text>
      <Text style={styles.homeSubtitle}>Choose a piece to start learning!</Text>

      <View style={styles.pieceGrid}>
        {PIECES.map((piece) => (
          <Pressable
            key={piece.name}
            style={({ pressed }) => [
              styles.pieceTile,
              pressed && styles.pieceTilePressed,
            ]}
            onPress={() => {
              console.log(`🧩 Selected piece: ${piece.name}`);
              onSelectPiece(piece.name);
            }}
          >
            <Text style={styles.pieceEmoji}>{piece.emoji}</Text>
            <Text style={styles.pieceLabel}>{piece.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function LessonScreen({
  piece,
  onBack,
  onPractice,
}: {
  piece: PieceName;
  onBack: () => void;
  onPractice: () => void;
}) {
  const lesson = PIECE_LESSONS[piece];
  const pieceData = PIECES.find(p => p.name === piece)!;

  return (
    <LinearGradient
      colors={[pieceData.color, colors.primaryDark]}
      style={styles.lessonContainer}
    >
      <SafeAreaView style={styles.lessonSafeArea}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.lessonContent}>
          <Text style={styles.lessonEmoji}>{pieceData.emoji}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>

          <View style={styles.movementCard}>
            <Text style={styles.movementTitle}>🎯 How it Moves</Text>
            <Text style={styles.movementText}>{lesson.movement}</Text>
          </View>

          <View style={styles.chessBoard}>
            {[...Array(64)].map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.boardSquare,
                    isLight ? styles.lightSquare : styles.darkSquare,
                  ]}
                />
              );
            })}
          </View>

          <Pressable style={styles.practiceButton} onPress={onPractice}>
            <Text style={styles.practiceButtonText}>🎮 Practice Moving!</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App() {
  console.log('✅ Chess Kids App starting!');

  const { isAuthenticated, isLoading } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [selectedPiece, setSelectedPiece] = useState<PieceName | null>(null);

  useEffect(() => {
    console.log('📱 Auth state:', { isAuthenticated, isLoading });
    if (!isLoading) {
      setCurrentScreen(isAuthenticated ? 'home' : 'login');
    }
  }, [isLoading, isAuthenticated]);

  const handleSelectPiece = (piece: PieceName) => {
    setSelectedPiece(piece);
    setCurrentScreen('lesson');
  };

  console.log('🎨 Rendering screen:', currentScreen);

  if (currentScreen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (currentScreen === 'login') {
    return <LoginScreen onNavigate={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'practice' && selectedPiece) {
    return (
      <PracticeScreen
        piece={selectedPiece}
        onBack={() => setCurrentScreen('lesson')}
      />
    );
  }

  if (currentScreen === 'lesson' && selectedPiece) {
    return (
      <LessonScreen
        piece={selectedPiece}
        onBack={() => setCurrentScreen('home')}
        onPractice={() => setCurrentScreen('practice')}
      />
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen
        onLogout={() => setCurrentScreen('login')}
        onSelectPiece={handleSelectPiece}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  loginContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.giant,
    fontWeight: 'bold',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: 60,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  homeSubtitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  pieceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pieceTile: {
    width: 100,
    height: 120,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pieceTilePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  pieceEmoji: {
    fontSize: 48,
  },
  pieceLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    padding: spacing.md,
  },
  logoutText: {
    color: colors.textLight,
    fontSize: fontSize.md,
  },
  // Lesson Screen Styles
  lessonContainer: {
    flex: 1,
  },
  lessonSafeArea: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  lessonContent: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  lessonEmoji: {
    fontSize: 100,
    marginBottom: spacing.md,
  },
  lessonTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lessonDescription: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  movementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  movementTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  movementText: {
    fontSize: fontSize.md,
    color: colors.white,
    lineHeight: 24,
  },
  chessBoard: {
    width: 240,
    height: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  boardSquare: {
    width: 30,
    height: 30,
  },
  lightSquare: {
    backgroundColor: '#F0D9B5',
  },
  darkSquare: {
    backgroundColor: '#B58863',
  },
  practiceButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  practiceButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
