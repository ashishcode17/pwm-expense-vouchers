# 📱 Build Android APK - Complete Guide

## Option A: Build on Your Windows/Mac Computer (RECOMMENDED)

### Prerequisites:
1. **Java JDK 17** - [Download](https://adoptium.net/)
2. **Android Studio** - [Download](https://developer.android.com/studio)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/ashishcode17/pwm-expense-vouchers.git
cd pwm-expense-vouchers
npm install
```

---

### Step 2: Open in Android Studio

1. **Open Android Studio**
2. **File → Open**
3. Navigate to: `pwm-expense-vouchers/android`
4. Click **OK**
5. Wait for Gradle sync to complete (5-10 minutes first time)

---

### Step 3: Build APK

**Method 1: Via Android Studio GUI**
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click **"locate"** when done
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Method 2: Via Command Line (Faster)**
```bash
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Step 4: Install APK on Phone

**Via USB:**
1. Enable **Developer Mode** on phone
2. Enable **USB Debugging**
3. Connect phone to computer
4. Run: `adb install app-debug.apk`

**Via File Transfer:**
1. Copy `app-debug.apk` to phone
2. Open file on phone
3. Click **Install**
4. Allow "Install from unknown sources" if needed

---

## Option B: GitHub Actions (Automatic Build)

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

Then download APK from GitHub Actions artifacts!

---

## Option C: Use AppGyver / Capacitor Cloud Build

1. Sign up at [Ionic Appflow](https://ionic.io/appflow)
2. Connect your GitHub repo
3. Configure build
4. Download APK

---

## 🎯 EASIEST METHOD: Use Android Studio on Your PC

**Download Android Studio:**
https://developer.android.com/studio

**Then follow Option A above!**

---

## 📝 App Details:

- **App Name:** PWM Expense Vouchers
- **Package:** com.propertywithmanish.vouchers
- **Version:** 1.0.0
- **Loads:** https://pwm-expense-vouchers.vercel.app

---

## ⚠️ Important Notes:

1. **Internet Required:** App loads from Vercel, needs internet
2. **First Build:** Takes 10-15 minutes (Gradle downloads)
3. **Subsequent Builds:** 1-2 minutes only
4. **APK Size:** ~5-10 MB
5. **Min Android:** Android 7.0+ (API 24)

---

## 🐛 Troubleshooting:

**"Gradle sync failed"**
- Update Gradle in Android Studio
- File → Settings → Build → Gradle
- Use Gradle 8.0+

**"SDK not found"**
- Android Studio → Settings → Android SDK
- Install SDK 33 (Android 13)

**"Build failed"**
- Clean build: `./gradlew clean`
- Try again: `./gradlew assembleDebug`

---

## ✅ Success!

Once APK is installed:
1. Open "PWM Expense Vouchers" app
2. Login with your email
3. Works exactly like website!
4. Automatic updates when you deploy to Vercel
