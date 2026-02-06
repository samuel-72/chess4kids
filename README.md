# ♟️ Chess Kids

**Chess Kids** is a fun, interactive mobile application designed to teach children how to play chess! Built with React Native and Expo, it features gamified lessons, particle celebrations, and "Fastest Finger" challenges.

## 🚀 Features

- **Interactive Lessons**: Learn how each piece moves with visual guides.
- **Practice Mode**:
  - **Learn Mode**: Explore moves at your own pace.
  - **Fastest Finger**: Race against the clock to find all valid moves!
- **Gamification**: Earn XP, level up, and unlock surprise rewards (Unicorns 🦄, Dinos 🦕!).
- **Safe Environment**: 
  - Guest Mode for instant play.
  - "Sign in with Google/Apple" integration (UI prepared).
- **Responsive Design**: Works on phones and tablets with resizable boards.

## 🛠 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
- **Expo Go App**: Install on your physical device (iOS/Android) to test.

## 🏁 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/samuel-72/chess4kids.git
    cd chess-kids
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npx expo start
    ```

4.  **Run on your device**:
    - Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).
    - Press `w` in the terminal to run in a web browser.
    - Press `i` for iOS Simulator or `a` for Android Emulator (requires Xcode/Android Studio).

## 📂 Project Structure

- **`app/`**: Expo Router entry points and layout configuration.
- **`screens/`**: Main application screens:
  - `LoginScreen.tsx`: Authentication and entry.
  - `HomeScreen.tsx`: Main dashboard and piece selection.
  - `LessonScreen.tsx`: Interactive lessons for each piece.
  - `PracticeScreen.tsx`: The core game logic (Learn & Fastest Finger modes).
- **`components/`**: Reusable UI components (e.g., `CelebrationOverlay`).
- **`stores/`**: State management using Zustand (`authStore`, `progressStore`).
- **`utils/`**: Helper logic:
  - `chessLogic.ts`: Rules for valid piece movement.
  - `soundEffects.ts`: Audio feedback handling.
- **`constants/`**: Theme colors, spacing, and font sizes.

## 🤝 How to Contribute

We welcome contributions! Here's how you can help:

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

### Adding a New Practice Mode
To add support for a new piece (e.g., Castling practice):
1.  Update `utils/chessLogic.ts` to include the specific move validation.
2.  Add the piece data to `PIECE_INFO` in `screens/PracticeScreen.tsx`.
3.  Ensure `LessonScreen` navigates correctly with the new `PieceType`.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
