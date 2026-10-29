import { Share } from 'react-native';

/** How a text ended up outside the app. */
export type CopyResult = 'copied' | 'shared' | 'dismissed';

interface ExpoClipboard {
  setStringAsync(text: string): Promise<boolean | void>;
}
interface CommunityClipboard {
  setString(text: string): void;
}

function loadClipboard(): ((text: string) => Promise<void>) | null {
  try {
    // Optional: expo-clipboard.
    const expo = require('expo-clipboard') as Partial<ExpoClipboard>;
    if (typeof expo.setStringAsync === 'function') {
      const set = expo.setStringAsync;
      return async (text) => {
        await set(text);
      };
    }
  } catch {
    // Not installed.
  }
  try {
    // Optional: @react-native-clipboard/clipboard.
    const mod = require('@react-native-clipboard/clipboard') as { default?: Partial<CommunityClipboard> } & Partial<CommunityClipboard>;
    const community = mod.default ?? mod;
    if (typeof community.setString === 'function') {
      const set = community.setString.bind(community);
      return async (text) => set(text);
    }
  } catch {
    // Not installed.
  }
  return null;
}

/**
 * Copies text with `expo-clipboard` or `@react-native-clipboard/clipboard` when
 * installed, otherwise opens the share sheet (which offers "Copy").
 */
export async function copyText(text: string): Promise<CopyResult> {
  const copy = loadClipboard();
  if (copy) {
    await copy(text);
    return 'copied';
  }
  const result = await Share.share({ message: text });
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
}
