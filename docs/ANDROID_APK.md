# Build an Android APK (Capacitor)

This app is a **React web client** wrapped with **[Capacitor](https://capacitorjs.com/)** so you can ship it as a native Android app.

## Prerequisites

1. **Node.js 20.x** (same as the rest of the project)
2. **Android Studio** (includes Android SDK, build tools, emulator)
3. **JDK 17** (Android Studio usually bundles this)

## One-time setup

From the **`client`** folder:

```bash
cd client
npm install
npm run build
npx cap add android
```

If `android/` already exists from a teammate, skip `cap add android` and run:

```bash
npx cap sync android
```

## Point the app at your API (optional)

- In the **APK**, API calls use your deployed backend by default (`https://qr-based-attendance.onrender.com`) unless you set **`REACT_APP_API_BASE_URL`** before building.
- To use another server, create **`client/.env.production`**:

```env
REACT_APP_API_BASE_URL=https://your-api.example.com
```

Then rebuild (`npm run build`) and sync Capacitor.

## Build the APK in Android Studio

1. Sync web assets into the Android project:

   ```bash
   cd client
   npm run cap:sync
   ```

   (`cap:sync` runs `npm run build` then `cap sync android`.)

2. Open the Android project:

   ```bash
   npm run cap:open
   ```

   Or open Android Studio → **Open** → select the **`client/android`** folder.

3. In Android Studio:
   - **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
   - Or use **Build → Generate Signed Bundle / APK** for a **release** build (Play Store / sideload).

4. The debug APK path is usually:

   `client/android/app/build/outputs/apk/debug/app-debug.apk`

## Notes

- **`homepage": "."`** in `client/package.json` makes Create React App emit **relative** asset URLs so the WebView can load JS/CSS from the APK.
- **`client/src/utils/api.js`** uses `@capacitor/core` so that on a **native** build the API base URL is absolute; in the browser it still uses `/api` (dev proxy or same-origin production).

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| White screen in APK | Run `npm run build`, then `npx cap sync android`; check Logcat for 404s on `/static/...` |
| **“Server not responding” on login (APK)** | 1) **Redeploy the API** so CORS includes Capacitor (`https://localhost`, `capacitor://`, …) — see `server/index.js`. 2) **Rebuild the APK** after pulling: `npm run cap:sync` — the client must use an absolute API URL in the WebView; `client/src/utils/api.js` detects `localhost` / native shell so requests go to `https://qr-based-attendance.onrender.com/api`, not `https://localhost/api`. 3) If it still fails, set `REACT_APP_API_BASE_URL` in `.env.production` and rebuild. |
| API errors / network | Set `REACT_APP_API_BASE_URL`, rebuild; ensure phone has internet; Render free tier may cold-start (~30–60s first request). |
| Gradle / SDK errors | Open **SDK Manager** in Android Studio; install recommended SDK + build-tools |
