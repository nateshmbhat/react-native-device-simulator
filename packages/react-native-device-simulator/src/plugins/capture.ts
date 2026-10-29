import { Platform, Share } from 'react-native';
import type { ViewHandle } from '../core/refs';
import type { Capture, CaptureBackend, CaptureOptions, SaveResult } from './capture-types';

export type { Capture, CaptureBackend, CaptureOptions, SaveResult } from './capture-types';

/** The parts of `react-native-view-shot` used here. */
interface ViewShotModule {
  captureRef(
    view: unknown,
    options?: { format?: 'png'; quality?: number; result?: 'tmpfile'; fileName?: string },
  ): Promise<string>;
}

/** The parts of `expo-sharing` used here. */
interface SharingModule {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(url: string, options?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<unknown>;
}

function loadViewShot(): ViewShotModule | null {
  try {
    // Optional peer dependency: the library works without it.
    const mod = require('react-native-view-shot') as Partial<ViewShotModule> & { default?: Partial<ViewShotModule> };
    const captureRef = mod.captureRef ?? mod.default?.captureRef;
    return typeof captureRef === 'function' ? { captureRef } : null;
  } catch {
    return null;
  }
}

function loadSharing(): SharingModule | null {
  try {
    // Optional: better sharing of files on Android.
    const mod = require('expo-sharing') as Partial<SharingModule>;
    return typeof mod.shareAsync === 'function' && typeof mod.isAvailableAsync === 'function'
      ? (mod as SharingModule)
      : null;
  } catch {
    return null;
  }
}

/** Native screenshots with `react-native-view-shot`, shared with `expo-sharing` or RN `Share`. */
export function getCaptureBackend(): CaptureBackend {
  return {
    get available() {
      return loadViewShot() !== null;
    },
    installHint: 'Screenshots need react-native-view-shot:\nnpx expo install react-native-view-shot',
    saveLabel: 'Share…',
    async capture(view: ViewHandle, options: CaptureOptions): Promise<Capture> {
      const viewShot = loadViewShot();
      if (!viewShot) throw new Error('react-native-view-shot is not installed.');
      const uri = await viewShot.captureRef(view, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        // Android only; the extension is added by the library.
        fileName: options.fileName.replace(/\.png$/i, ''),
      });
      return { uri: uri.includes('://') ? uri : `file://${uri}`, fileName: options.fileName };
    },
    async save(capture: Capture): Promise<SaveResult> {
      const sharing = loadSharing();
      if (sharing && (await sharing.isAvailableAsync().catch(() => false))) {
        await sharing.shareAsync(capture.uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: capture.fileName,
        });
        return 'shared';
      }
      const result = await Share.share(
        Platform.OS === 'ios' ? { url: capture.uri } : { message: capture.uri, title: capture.fileName },
        { dialogTitle: capture.fileName },
      );
      return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
    },
  };
}
