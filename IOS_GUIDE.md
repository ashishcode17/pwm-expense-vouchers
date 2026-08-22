# iOS access for PWM Expense Vouchers

## Short answer

| Option | Possible? | Notes |
|--------|-----------|--------|
| **iPhone Home Screen app (PWA)** | ✅ Yes, now | Free. Works on all modern iPhones via Safari |
| **iOS IPA like Android APK** | ⚠️ Limited | Needs Mac + Apple Developer account ($99/year). Cannot freely sideload on all iPhones |
| **App Store** | ⚠️ Yes, but heavy | Mac, certificates, Apple review, paid account |

Apple does **not** allow free “download IPA and install on every iPhone” like Android APKs.

---

## Best option for your office: Install from Safari (recommended)

On any iPhone/iPad:

1. Open Safari (not Chrome)
2. Go to: **https://vouchers.propertywithmanish.com**
3. Tap the **Share** button
4. Tap **Add to Home Screen**
5. Tap **Add**

Home screen pe app icon aa jayega. Full-screen website jaisi app chalegi.

Internet required. Same login/vouchers as Android/web.

---

## Real native iOS app (Capacitor IPA)

Possible, but you need:

1. A **Mac** with **Xcode**
2. **Apple Developer Program** ($99/year)
3. Then we can add `ios/` Capacitor project and build
4. Distribute via **TestFlight** (team) or **App Store** (public)

Without those, a native iOS build cannot be installed on other people’s phones.

---

## Android vs iOS reality

- **Android:** APK download → install on almost any phone ✅  
- **iOS:** Home Screen PWA for everyone ✅ / native IPA only with Apple account ⚠️
