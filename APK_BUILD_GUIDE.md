# PWM Expense Vouchers — Android APK

## Download (latest release)

https://github.com/ashishcode17/pwm-expense-vouchers/releases

Use **v1.4+** (release-signed, PWM Voucher logo). Prefer over older debug APKs.

## What this APK is

A weblink shell that opens:

**https://vouchers.propertywithmanish.com**

(Old Vercel URL still works as backup, but APK uses the branded domain.)

## Install notes (Play Protect / “needs scan”)

Sideloaded apps (not from Play Store) will often show:
- “Install unknown apps”
- “Play Protect scan”

That is **normal Android behavior**. We cannot fully remove it without publishing on Google Play.

What we did to make installs safer/cleaner:
- **Release-signed APK** (not debug-signed)
- Stable package id: `com.propertywithmanish.vouchers`
- Versioned releases (v1.2+)

After first install, later updates with the same signing key are smoother.

## Features in the app shell

- Hardware **Back** goes one page back (does not immediately minimize)
- Works on Android 7.0+ phones
- Camera/gallery for bill upload (permission may be asked)

## Rebuild release APK (developers)

```bash
# Create android/keystore.properties (not committed) pointing at your keystore
cd android
./gradlew assembleRelease
```

Output:
`android/app/build/outputs/apk/release/app-release.apk`
