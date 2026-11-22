import { Linking } from 'react-native';
import { config } from '../config';
import { notify } from './dialogs';

/**
 * Support links that always do something: if WhatsApp or a mail app isn't installed,
 * the user sees the number or address instead of a button that silently does nothing.
 */
export async function openWhatsAppSupport(fallbackTitle: string, message?: string) {
  // wa.me opens the WhatsApp app when installed (Android app links / iOS universal links), else the browser.
  // A whatsapp:// check would need extra manifest queries, so it isn't used.
  const url = `https://wa.me/${config.supportWhatsApp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  try {
    await Linking.openURL(url);
  } catch {
    notify(fallbackTitle, `+${config.supportWhatsApp}`);
  }
}

export async function openSupportEmail(fallbackTitle: string, subject?: string) {
  const url = `mailto:${config.supportEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  try {
    await Linking.openURL(url);
  } catch {
    notify(fallbackTitle, config.supportEmail);
  }
}

export async function openLink(url: string, fallbackTitle: string) {
  try {
    await Linking.openURL(url);
  } catch {
    notify(fallbackTitle, url);
  }
}
