# PWM Expense Vouchers — Android Weblink APK

This APK is a **native Android shell** that opens your live website:

**https://pwm-expense-vouchers.vercel.app**

## Compatibility

| Requirement | Value |
|-------------|--------|
| Minimum Android | **7.0 (API 24)** |
| Target Android | 15 (API 35) |
| CPU | armeabi-v7a, arm64-v8a, x86, x86_64 |
| Coverage | Virtually all Android phones in active use |

Capacitor 8 cannot go below Android 7.0. That still covers almost every phone sold/used today.

## Download

Latest release: https://github.com/ashishcode17/pwm-expense-vouchers/releases

Install steps:
1. Download `PWM-Expense-Vouchers.apk`
2. Open on phone → Install
3. Allow **Install unknown apps** if asked
4. Open app → website loads inside the app
5. Internet required

## What works on phones

- Login / signup
- Create vouchers
- Camera / gallery for bill upload (permission prompt may appear)
- Print / PDF on supported devices
- Works on small and large screens

## Rebuild locally

```bat
git pull origin main
cd android
gradlew.bat clean assembleDebug
```

APK output:
`android\app\build\outputs\apk\debug\app-debug.apk`
