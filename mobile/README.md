# RAM Finance Mobile

Ionic Angular + Capacitor client for the existing RAM Finance API. The app uses the same production data and authentication as the React web client.

## Run locally

Start the backend from `../backend`, then:

```powershell
npm install
npm start
```

Development uses `http://localhost:5000/api`. Production builds use `https://fwa-8gk1.onrender.com/api`.

## Verify and sync native projects

```powershell
npm run lint
npm run build
npx cap sync
```

## Android

```powershell
npx cap open android
```

Build an APK/AAB with Android Studio. The generated native project is in `android/`.

## iOS

```bash
npx cap open ios
```

The generated Xcode project is in `ios/`. Building and signing it requires macOS with Xcode.
