# ♟️ Chess Kids

**Chess Kids** is a fun, interactive mobile application designed to teach children how to play chess! 

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
