import type { ViewHandle } from '../core/refs';
import type { Capture, CaptureBackend, CaptureOptions, SaveResult } from './capture-types';

export type { Capture, CaptureBackend, CaptureOptions, SaveResult } from './capture-types';

/*
 * Web screenshots serialize the DOM subtree (with computed styles) into an SVG
 * `foreignObject` and rasterize it on a canvas, so the SVG device frame, masks,
 * images and the app are captured exactly as rendered.
 *
 * - `modern-screenshot` (preferred): keeps scroll positions and scrollbar styles.
 * - `html-to-image` (fallback): same technique, but scrolled views are captured
 *   at their top.
 *
 * Both are optional dependencies, resolved lazily.
 */

/** Styles applied to the cloned root: natural size, at the image origin. */
const ROOT_STYLE = {
  // The fit-to-window `scale()` must not apply to the capture.
  transform: 'none',
  // `static` ignores every inset (left/top and logical inset-* longhands
  // copied from the computed style), so the root is drawn at (0, 0).
  position: 'static',
  margin: '0px',
  opacity: '1',
} satisfies Partial<CSSStyleDeclaration>;

type Rasterize = (node: HTMLElement, options: { width: number; height: number; pixelRatio: number }) => Promise<string>;

interface ModernScreenshot {
  domToPng(
    node: Node,
    options?: {
      width?: number;
      height?: number;
      scale?: number;
      style?: Partial<CSSStyleDeclaration>;
      timeout?: number;
      features?: { restoreScrollPosition?: boolean };
    },
  ): Promise<string>;
}

interface HtmlToImage {
  toPng(
    node: HTMLElement,
    options?: { width?: number; height?: number; pixelRatio?: number; style?: Partial<CSSStyleDeclaration>; cacheBust?: boolean },
  ): Promise<string>;
}

function loadRasterizer(): Rasterize | null {
  try {
    // Optional dependency.
    const lib = require('modern-screenshot') as Partial<ModernScreenshot>;
    if (typeof lib.domToPng === 'function') {
      const domToPng = lib.domToPng;
      return (node, { width, height, pixelRatio }) =>
        domToPng(node, {
          width,
          height,
          scale: pixelRatio,
          style: ROOT_STYLE,
          timeout: 15000,
          // Opt-in: draw scrolled views at their current offset.
          features: { restoreScrollPosition: true },
        });
    }
  } catch {
    // Not installed.
  }
  try {
    // Optional dependency.
    const lib = require('html-to-image') as Partial<HtmlToImage>;
    if (typeof lib.toPng === 'function') {
      const toPng = lib.toPng;
      return (node, { width, height, pixelRatio }) =>
        toPng(node, { width, height, pixelRatio, style: ROOT_STYLE, cacheBust: false });
    }
  } catch {
    // Not installed.
  }
  return null;
}

function asElement(view: ViewHandle): HTMLElement {
  // Under react-native-web, host component refs are DOM elements.
  const node = view as unknown as HTMLElement;
  if (!node || typeof node.offsetWidth !== 'number') throw new Error('Nothing to capture: the view is not mounted.');
  return node;
}

export function getCaptureBackend(): CaptureBackend {
  return {
    get available() {
      return loadRasterizer() !== null;
    },
    installHint: 'Screenshots on web need modern-screenshot:\nnpm install modern-screenshot',
    saveLabel: 'Download PNG',
    async capture(view: ViewHandle, options: CaptureOptions): Promise<Capture> {
      const rasterize = loadRasterizer();
      if (!rasterize) throw new Error('modern-screenshot is not installed.');
      const node = asElement(view);
      // Layout size, unaffected by the fit-to-window `transform: scale()`.
      const uri = await rasterize(node, {
        width: node.offsetWidth,
        height: node.offsetHeight,
        pixelRatio: options.pixelRatio,
      });
      return { uri, fileName: options.fileName };
    },
    async save(capture: Capture): Promise<SaveResult> {
      const link = document.createElement('a');
      link.href = capture.uri;
      link.download = capture.fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return 'downloaded';
    },
  };
}
