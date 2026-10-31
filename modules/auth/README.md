# Authentication module

`auth.js` owns the production sign-in and sign-out integration, Supabase-backed storage adapter,
user and holding-snapshot APIs, build label, and inactivity timeout. It runs synchronously in the
document head after `config.js` and the Policies scripts so existing startup ordering is preserved.

The app-facing API is exposed as `window.VRSB`; the module also provides `window.claude` as the
storage adapter used by the existing app. Keep this script before the document body is parsed:
it registers DOM-ready handlers and initializes authentication state before the app starts.

The inactivity timer is configured through `idleMinutes` in the root `config.js`.

Run `node tests/session-timeout.test.js` after changing the timeout behavior.
