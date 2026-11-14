import { Alert, Platform } from 'react-native';

/**
 * Alert.alert does nothing in a browser (react-native-web), so messages and confirmations
 * fall back to the browser's own dialogs there.
 */
export function notify(title: string, body?: string) {
  if (Platform.OS === 'web') globalThis.alert?.(body ? `${title}\n\n${body}` : title);
  else Alert.alert(title, body);
}

/** Asks before an action; runs onOk only when the person confirms. */
export function confirmAction(
  title: string,
  body: string,
  labels: { cancel: string; ok: string },
  onOk: () => void,
  destructive = false,
) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${body}`)) onOk();
    return;
  }
  Alert.alert(title, body, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.ok, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}
