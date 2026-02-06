// Theme colors for the app
export const colors = {
    primary: '#6C63FF',      // Friendly Purple
    primaryLight: '#8B85FF',
    primaryDark: '#5147E5',
    secondary: '#FF6B6B',    // Warm Coral
    secondaryLight: '#FF8A8A',
    success: '#4ECDC4',      // Mint Green
    warning: '#FFE66D',      // Sunny Yellow
    error: '#FF6B6B',

    // Chess board colors
    boardLight: '#F7F1E3',   // Cream
    boardDark: '#7B8D8E',    // Sage
    boardHighlight: '#90EE90', // Light green for valid moves
    boardSelected: '#FFD700',  // Gold for selected square

    // UI colors
    background: '#F8F9FF',
    card: '#FFFFFF',
    text: '#2D3436',
    textLight: '#636E72',
    white: '#FFFFFF',
    black: '#000000',

    // Piece colors
    whitePiece: '#FFFACD',
    blackPiece: '#2D3436',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 999,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    giant: 48,
};

// Chess piece symbols for display
export const pieceSymbols: Record<string, string> = {
    pawn: '♟',
    knight: '♞',
    bishop: '♝',
    rook: '♜',
    queen: '♛',
    king: '♚',
};

// Piece names for display
export const pieceNames: Record<string, string> = {
    pawn: 'Pawn',
    knight: 'Knight',
    bishop: 'Bishop',
    rook: 'Rook',
    queen: 'Queen',
    king: 'King',
};

// Piece descriptions for kids
export const pieceDescriptions: Record<string, string> = {
    pawn: 'The little soldier! Moves forward one square at a time.',
    knight: 'The jumping horse! Moves in an L-shape.',
    bishop: 'The diagonal master! Slides diagonally across the board.',
    rook: 'The tower! Moves straight up, down, left, or right.',
    queen: 'The powerful queen! Can move in any direction.',
    king: 'The important king! Moves one square in any direction.',
};

// Piece emojis for fun display
export const pieceEmojis: Record<string, string> = {
    pawn: '🎖️',
    knight: '🐴',
    bishop: '⛪',
    rook: '🏰',
    queen: '👑',
    king: '🤴',
};
