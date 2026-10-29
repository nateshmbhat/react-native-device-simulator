import type { ViewHandle } from '../core/refs';

export interface CaptureOptions {
  /** Output pixels per logical pixel. */
  pixelRatio: number;
  /** File name, including the `.png` extension. */
  fileName: string;
}

export interface Capture {
  /** `data:` URL on web, `file://` URI on native. Usable as an `<Image>` source. */
  uri: string;
  fileName: string;
}

/** What happened when the user saved a capture. */
export type SaveResult = 'downloaded' | 'shared' | 'dismissed';

/** Platform-specific screenshot implementation. */
export interface CaptureBackend {
  /** Whether the optional dependency the backend needs is installed. */
  readonly available: boolean;
  /** Install instructions shown when unavailable. */
  readonly installHint: string;
  /** Label of the save action ("Download PNG", "Share…"). */
  readonly saveLabel: string;
  capture(view: ViewHandle, options: CaptureOptions): Promise<Capture>;
  save(capture: Capture): Promise<SaveResult>;
}
