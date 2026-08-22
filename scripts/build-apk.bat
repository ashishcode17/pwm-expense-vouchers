@echo off
setlocal
cd /d "%~dp0.."

echo === PWM Expense Vouchers APK Builder ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

where java >nul 2>nul
if errorlevel 1 (
  echo ERROR: Java not found. Install JDK 17 from https://adoptium.net
  pause
  exit /b 1
)

echo [1/4] Installing npm packages...
call npm install
if errorlevel 1 (
  echo npm install failed
  pause
  exit /b 1
)

echo [2/4] Preparing web assets...
if not exist out mkdir out
if not exist out\index.html (
  echo ^<!DOCTYPE html^>^<html^>^<body^>Loading...^</body^>^</html^> > out\index.html
)

echo [3/4] Syncing Capacitor Android...
call npx cap sync android
if errorlevel 1 (
  echo Capacitor sync had warnings - continuing...
)

echo [4/4] Building APK with Gradle...
cd android
call gradlew.bat clean
call gradlew.bat assembleDebug --no-daemon --refresh-dependencies
if errorlevel 1 (
  echo.
  echo BUILD FAILED. Open the android folder in Android Studio and sync, then try again.
  pause
  exit /b 1
)

echo.
echo ========================================
echo SUCCESS! APK ready:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
explorer.exe "app\build\outputs\apk\debug"
pause
