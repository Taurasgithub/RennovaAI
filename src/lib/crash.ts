import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { config } from '../config';

/**
 * Crash reporting without a third-party account: reports go to the AI Worker (worker/src/index.js,
 * POST /api/errors), which writes them to its log (Cloudflare dashboard → Workers → rennovaai-ai → Logs).
 * Only technical details are sent: message, stack, screen, platform and app version. No user data.
 */

let currentScreen = '';
const sent = new Set<string>();

/** Remember the visible route, so reports say where the crash happened. */
export function setCrashScreen(pathname: string) {
  currentScreen = pathname;
}

export function reportCrash(error: unknown, fatal = false) {
  if (__DEV__ || !config.apiUrl) return; // in development the red error screen already shows it
  const err = error instanceof Error ? error : new Error(String(error));
  const key = `${err.message}|${(err.stack ?? '').slice(0, 200)}`;
  if (sent.has(key) || sent.size > 20) return; // one report per distinct error per session
  sent.add(key);
  fetch(`${config.apiUrl}/api/errors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fatal,
      message: err.message.slice(0, 500),
      stack: (err.stack ?? '').slice(0, 6000),
      screen: currentScreen,
      platform: Platform.OS,
      os: String(Platform.Version),
      appVersion: Constants.expoConfig?.version ?? '',
      update: Updates.updateId ?? 'embedded',
    }),
  }).catch(() => {});
}

let installed = false;

/** Also report errors thrown outside rendering (event handlers, timers), which error boundaries miss. */
export function installCrashHandler() {
  if (installed) return;
  installed = true;
  const utils = (globalThis as { ErrorUtils?: { getGlobalHandler: () => (e: unknown, fatal?: boolean) => void; setGlobalHandler: (h: (e: unknown, fatal?: boolean) => void) => void } }).ErrorUtils;
  if (!utils) return; // web
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, fatal) => {
    reportCrash(error, !!fatal);
    previous(error, fatal);
  });
}
