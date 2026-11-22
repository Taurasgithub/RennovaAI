@AGENTS.md

# RennovaAI — working rules for Claude Code

Expo SDK 58, Expo Router (`src/app`), Supabase, Cloudflare Worker (`worker/`), English + Urdu (`src/i18n`).

## Skills

Before starting any task, say which skill(s) you are using. Load them with the Skill tool before writing code.

| Task | Skills |
| --- | --- |
| Project structure / new features | `expo:expo-project-structure`, `react-native-architecture` (start any Expo task with `expo:expo-overview`) |
| Navigation, modals, sheets, tabs | `expo:expo-router` |
| Screens & components | `ui-ux-pro-max` + `frontend-design` + `expo:expo-native-ui` + `react-native-expert` |
| Animation | `expo:expo-animation` |
| Performance, lists, keyboard, SafeArea | `vercel-react-native-skills` + `react-native-expert` (deep profiling: `react-native-performance`) |
| Data fetching / network | `expo:expo-data-fetching` |
| Backend / API routes | `expo:eas-hosting` (Expo Router API routes). This app's backend is Supabase + the Cloudflare Worker: also follow `supabase/README.md` and `worker/README.md` |
| Native code / modules | `expo:expo-module` |
| Dev builds | `expo:expo-dev-client` |
| Testing on a device | `agent-device` when a device is connected over adb; otherwise see "Checking UI changes" below. Unit tests: `react-native-testing`; end-to-end: `react-native-e2e-testing` |
| CI | `expo:eas-workflows` + `github-actions` |
| Store release | `expo:eas-app-stores` (also `PUBLISHING.md`); OTA updates: `expo:eas-update` |
| Security | `react-native-security` |
| Translations | `react-native-i18n` (strings live in `src/i18n/en.ts` and `src/i18n/ur.ts`; add both) |
| SDK upgrades | `expo:expo-upgrade` |

If two skills conflict: Expo official skills (`expo:*`) win for Expo APIs; `ui-ux-pro-max` wins for visual design.

## Styling

- Use the existing design tokens in `src/theme` (`colors`, `spacing`, `radius`, `fonts`, `shadow`) and admin tokens in `src/theme/admin.ts`, plus the shared components in `src/components` (`ui.tsx`, `motion.tsx`, `admin/kit.tsx`).
- No hardcoded colors or spacing in screens. Add a token when one is missing.
- The app uses React Native `StyleSheet`, not gluestack or NativeWind. Don't introduce either without an agreed migration plan.
- Text contrast at least 4.5:1; touch targets at least 44 pt; respect reduced motion.

## Rules

- Use `npx expo install` (not `npm install`) for Expo-compatible packages.
- Run `npx tsc --noEmit` and `npx expo lint` before calling a task done.
- Never put Supabase secret / service_role keys in the app; only `EXPO_PUBLIC_*` public values. Never commit `.env` files.
- Database changes go in a new file under `supabase/migrations/` and are shown to the user before they run on the live project.

## Checking UI changes

Every UI change must be checked visually before it is called done:
1. Run the web build and check the screen in Chrome with the Chrome DevTools MCP (screenshot, console errors, React DevTools tools).
2. For anything native-only (keyboard, haptics, camera, native sign-in, layout differences), run the app for Expo Go and ask the user to confirm on their phone:
   `$env:REACT_NATIVE_PACKAGER_HOSTNAME='<wifi-ip>.nip.io'; npx expo start --lan --port 8081`, then open `exp://<wifi-ip>.nip.io:8081` from inside Expo Go.
   The nip.io hostname is required: Supabase rejects sign-in redirects to bare IP addresses.
3. This PC has no Android SDK or emulator and little free memory; don't start emulators.
