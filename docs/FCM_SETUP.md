# Firebase Cloud Messaging (FCM) Setup

Push notifications require a Firebase project. Follow these steps to set up FCM for both the mobile app and backend.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and name it (e.g., "Reverse Marketplace")
3. Disable Google Analytics (optional for MVP) and create the project

## 2. Add Android App

1. In Firebase Console, click "Add app" > Android
2. Package name: `com.reversemarket.reverse_marketplace`
3. Download `google-services.json`
4. Place it at: `mobile/android/app/google-services.json`

## 3. Add iOS App

1. In Firebase Console, click "Add app" > iOS
2. Bundle ID: `com.reversemarket.reverseMarketplace`
3. Download `GoogleService-Info.plist`
4. Place it at: `mobile/ios/Runner/GoogleService-Info.plist`
5. In Xcode: Right-click Runner folder > "Add Files to Runner" > select the plist
6. In Xcode: Runner > Signing & Capabilities > + Capability > Push Notifications
7. In Xcode: Runner > Signing & Capabilities > + Capability > Background Modes > check "Remote notifications"

## 4. Get Backend Credentials

1. In Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key" > download JSON file
3. Extract these values for your backend `.env`:

```env
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Note: The private key must be a single line with `\n` for newlines, wrapped in double quotes.

## 5. Test Push Notifications

### From Firebase Console
1. Go to Firebase Console > Messaging > "Create your first campaign"
2. Select "Firebase Notification messages"
3. Enter a title and body
4. Target your app
5. Send test message (use an FCM token from the app logs)

### From Backend
The backend sends push notifications automatically through the BullMQ notification pipeline when:
- A new offer is received on a post
- A transaction status changes
- Escrow is released (auto or manual)
- A message is received while offline
- Posts expire

## 6. Sentry DSN (Optional)

For crash reporting, also set `SENTRY_DSN` in backend `.env`:

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

## Troubleshooting

- **Android build fails after adding google-services.json**: Run `cd mobile && flutter clean && flutter pub get`
- **iOS build fails**: Ensure `GoogleService-Info.plist` is added to the Xcode project (not just the file system)
- **No token on iOS simulator**: FCM tokens require a real device on iOS. Use Android emulator for testing.
- **Token not registering**: Check that the backend is running and the user is logged in (token registration requires auth)
