# Use platform-specific local storage behind repositories

The app is offline-first on Android but is expected to support the web later. Use SQLite for native builds and browser storage for the web behind the same repository interfaces, because Expo SQLite web support is still alpha and requires deployment-specific WASM headers; domain and feature code must not depend on either storage technology directly.

