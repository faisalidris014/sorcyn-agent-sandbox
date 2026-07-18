# Reverse Marketplace — Mobile App

Flutter mobile application for the Reverse Marketplace platform. Supports iOS, Android, and Web.

## Tech Stack

| Technology | Purpose |
|---|---|
| Flutter 3.16+ (Dart 3.2+) | Cross-platform UI framework |
| Riverpod 2.6 | State management (StateNotifier + FutureProvider) |
| GoRouter 14.8 | Declarative routing with auth guards |
| Dio 5.7 | HTTP client with interceptors (auth, logging) |
| Socket.IO Client 3.0 | Real-time WebSocket communication |
| flutter_secure_storage | Encrypted token/preference storage |
| flutter_localizations + intl | i18n (10 languages) |
| json_serializable | JSON model code generation |

## Architecture

**Feature-first** directory structure with Riverpod state management:

```
Screen (ConsumerStatefulWidget)
    |
Provider (StateNotifier / FutureProvider)
    |-- REST calls via Repository (Dio)
    |-- Real-time events via SocketClient streams
    |
Repository → DioClient (interceptors) → Backend API
SocketClient → Socket.IO Server (JWT auth, rooms)
```

**Key patterns:**
- GoRouter with auth guards (redirect unauthenticated → login, unverified → verify-email)
- `StatefulShellRoute.indexedStack` for bottom nav (preserves tab state)
- Buyer/seller mode toggle (persisted to SecureStorage, reactive UI switching)
- Optimistic UI updates for real-time chat
- Hybrid real-time + polling for message delivery
- ARB-based i18n with code generation

## Project Structure

```
lib/
├── main.dart                        # Entry point (ProviderScope → App)
├── app.dart                         # GoRouter + i18n delegates + auth guards
├── core/
│   ├── config/                      (env_config, app_config)
│   ├── providers/                   (app_mode, socket, locale)
│   ├── theme/                       (app_colors, app_theme — Material 3 purple)
│   ├── network/                     (dio_client, socket_client, api_response)
│   ├── storage/                     (secure_storage)
│   └── utils/                       (validators, formatters, l10n_extension)
├── l10n/                            # Localization (10 .arb files + generated code)
├── features/
│   ├── auth/                        # 5 screens (login, register, verify, forgot/reset password)
│   ├── categories/                  # Category model, repo, provider
│   ├── posts/                       # 7 screens (dashboard, create, AI/manual, detail, my posts)
│   ├── feed/                        # Seller feed with filters + infinite scroll
│   ├── offers/                      # 4 screens (post offers, detail, submit, my offers)
│   ├── transactions/                # 3 screens (list, buyer detail, seller detail)
│   ├── sellers/                     # 4 screens (setup, profile, verification, Stripe onboard)
│   ├── messages/                    # 2 screens + 3 widgets (conversations, chat, real-time)
│   ├── settings/                    # Language settings
│   └── profile/                     # Profile with buyer/seller mode toggle
└── shared/widgets/                  # Reusable components (nav shell, status badge, etc.)
```

## Setup

See [docs/setup.md](../docs/setup.md) for full instructions.

```bash
# Install dependencies
flutter pub get

# Generate JSON serialization code
dart run build_runner build --delete-conflicting-outputs

# Run on web
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api/v1

# Run on iOS
flutter run -d ios --dart-define=API_BASE_URL=http://localhost:3000/api/v1

# Run on Android (use 10.0.2.2 for emulator → host)
flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1

# Run on a PHYSICAL iOS device
# (localhost on the device = the device itself, not your Mac — must use the Mac's LAN IP)
MAC_IP=$(ipconfig getifaddr en0)                # Wi-Fi interface on most Macs
flutter run -d <device-udid> --dart-define=API_BASE_URL=http://${MAC_IP}:3000/api/v1
# Tip: `flutter devices` lists UDIDs. Use the UDID, not the name —
# device names often contain a curly apostrophe (e.g. "Faisal's iPhone")
# that doesn't match a typed straight quote.
# Requires: Mac + iPhone on the same Wi-Fi, macOS firewall set to allow
# inbound on the node process, and backend listening on *:3000 (default).
```

## Supported Languages

| Code | Language | Native Name |
|---|---|---|
| en | English | English |
| es | Spanish | Español |
| zh | Chinese | 中文 |
| ar | Arabic | العربية |
| fr | French | Français |
| pt | Portuguese | Português |
| hi | Hindi | हिन्दी |
| vi | Vietnamese | Tiếng Việt |
| ko | Korean | 한국어 |
| ja | Japanese | 日本語 |

## Features Built

- **Session 10:** Project scaffold, core layer (theme, Dio, Riverpod, GoRouter), auth screens (5), secure storage
- **Session 11:** Buyer screens (dashboard, post creation with AI + manual, my posts, offers, transactions), bottom navigation shell, shared widgets
- **Session 12:** Seller screens (profile setup, feed, offer submission, transaction management), buyer/seller mode toggle, full profile screen
- **Session 13:** Real-time messaging (Socket.IO client, conversations, chat with typing indicators + optimistic sends + read receipts), i18n (10 languages), language settings
