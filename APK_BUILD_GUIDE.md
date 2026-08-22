# Build Android APK — PWM Expense Vouchers

The app loads your live website: `https://pwm-expense-vouchers.vercel.app`

## Easiest way: Download from GitHub Actions

1. Open: https://github.com/ashishcode17/pwm-expense-vouchers/actions
2. Click the latest **"Build Android APK"** run (green check)
3. Scroll to **Artifacts**
4. Download **PWM-Expense-Vouchers-APK**
5. Unzip → you get `PWM-Expense-Vouchers.apk`
6. Copy APK to your Android phone and install it
   - Enable **Install unknown apps** if asked

To rebuild anytime: Actions → **Build Android APK** → **Run workflow**

---

## Local build (optional)

### Requirements
- Node.js 20+
- Java JDK 17
- Android Studio (or Android SDK)

### Commands

```bash
git clone https://github.com/ashishcode17/pwm-expense-vouchers.git
cd pwm-expense-vouchers
git pull origin main
npm install

# Create placeholder web assets (app uses live URL)
mkdir -p out
echo '<html><body>Loading...</body></html>' > out/index.html

npx cap sync android

cd android
./gradlew assembleDebug
```

APK path:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Android Studio
1. Open folder `android`
2. Wait for Gradle sync
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## Notes
- This is a **debug APK** (fine for internal office use)
- Internet is required — the app opens your Vercel site
- Package id: `com.propertywithmanish.vouchers`
