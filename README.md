# ♟️ Chess Kids

**Chess Kids** is a fun, interactive mobile application designed to teach children how to play chess! 

## ✨ Features

- **Interactive Lessons**: Learn how each piece moves with guided tutorials.
- **"Fastest Finger" Game**: Race against the clock to find valid moves!
- **Guest Mode**: Jump right in with fun, auto-generated usernames.
- **Progress Tracking**: Earn stars and unlock new lessons.
- **Mobile Optimized**: Smooth animations and responsive layout for all devices. 

## 📲 Download & Play

No coding required! You can download the app for your Android or iOS device.

### Android 🤖
- **[Download APK (Coming Soon)](#)**
- *To install: Download the .apk file and tap to install.*

### iOS 🍎
- **[Download IPA (Coming Soon)](#)**
- *Requires TestFlight invitation.*

---

## 🛠 For Developers (Build from Source)

If you want to contribute or build the app yourself:

### Prerequisites
- **Node.js**: [Download](https://nodejs.org/)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli` (for building APKs)

### Setup
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/samuel-72/chess4kids.git
    cd chess-kids
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run locally**:
    ```bash
    npx expo start
    ```

    This will start the development server. Scan the QR code with the **Expo Go** app on your phone, or press `w` to run in a web browser.

4.  **Run tests**:
    ```bash
    npm test
    ```
    This runs the Jest test suite (34 tests) covering:
    - Move validation for all 6 pieces (pawn, knight, bishop, rook, queen, king)
    - Special moves: en passant, short/long castling
    - Edge cases: blocking by friendlies, captures, board boundaries
    - Piece scaling utilities

### 📂 Project Structure

```
chess-kids/
├── app/                    # Screens & navigation (Expo Router)
│   └── lesson/[piece].tsx  # Controller: orchestrates lesson flow
├── components/
│   └── lesson/
│       ├── LessonModeSelect.tsx  # Mode selection screen
│       ├── LessonGame.tsx        # Board, HUD, gestures
│       └── LessonComplete.tsx    # Completion/reward screen
├── hooks/
│   ├── useGameScenarios.ts # Lesson curriculum & scenario generation
│   └── useGameLogic.ts     # Game state, scoring, move handling
├── utils/
│   ├── chessLogic.ts       # Move validation engine
│   ├── pieceScaling.ts     # Visual scaling per piece type
│   └── __tests__/          # Unit tests (Jest + ts-jest)
├── types/
│   └── chess.ts            # Shared types (PieceType, GameMode)
├── constants/
│   ├── gameData.ts         # PIECE_INFO, REWARDS, REAL_PIECES
│   └── theme.ts            # Design tokens
├── stores/
│   └── progressStore.ts    # Zustand state (user progress)
└── assets/                 # Images and sounds
```

## 🌐 Web Distribution

### Option 1: GitHub Pages (Automated)
1.  Go to **Settings > Pages** in your repository.
2.  Under **Source**, select **GitHub Actions**.
3.  The pre-configured workflow (`.github/workflows/deploy.yml`) will automatically verify and deploy your app whenever you push to `master`.

### Option 2: Manual Deploy
Run this command to build and deploy from your computer:
```bash
npm run deploy
```
This puts the website at: `https://samuel-72.github.io/chess4kids`

### Option 3: Export Static Files
```bash
npx expo export -p web
```
Upload the `dist/` folder to Vercel, Netlify, or anywhere else!

### How to Build the App (APK)
To generate the installable Android file:

1.  **Login to Expo**:
    ```bash
    eas login
    ```

2.  **Build**:
    ```bash
    eas build -p android --profile preview
    ```
    This will generate a downloadable link for the `.apk` file.

## 🤝 How to Contribute

We welcome contributions!
1.  Fork the Project
2.  Create your Feature Branch
3.  Commit your Changes
4.  Push to the Branch
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
